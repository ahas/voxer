import ts from "typescript";
import { resolve } from "node:path";
import { TypeExtractor } from "./type-extractor";
import { ACCESSOR_DECORATOR_NAME, EXPOSE_DECORATOR_NAME, INJECTABLE_DECORATOR_NAME } from "./constants";
import { TypeInferer } from "./type-inferer";
import { TypeUtils } from "./type-utils";
import { TypeReplacer } from "./type-replacer";
import { TypeInjector } from "./type-injector";

const f = ts.factory;

export class TypeTranslator extends TypeInjector {
  private _injectables: ts.Symbol[] = [];
  private _extractor: TypeExtractor;
  private _inferer: TypeInferer;
  private _replacer: TypeReplacer;

  private _memoizedSymbols: Map<string, ts.Symbol> = new Map();
  private _externalModules: Map<string, (ts.ImportSpecifier | ts.ImportClause)[]> = new Map();

  constructor(cwd: string) {
    const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

    if (!configFile) {
      throw Error("tsconfig.json not found");
    }

    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, resolve(cwd, "src"));

    super(
      ts.createProgram({
        options,
        rootNames: fileNames,
        configFileParsingDiagnostics: errors,
      })
    );
    this._extractor = new TypeExtractor(this._program, cwd);
    this._replacer = new TypeReplacer();
    this._inferer = new TypeInferer(this._program);
  }

  private _memoizeSymbol(symbol: ts.Symbol): boolean {
    const symbolName = this._typeChecker.symbolToString(symbol);

    if (this._memoizedSymbols.has(symbolName)) {
      return false;
    }

    this._memoizedSymbols.set(symbolName, symbol);

    return true;
  }

  private _insertImportDeclarations() {
    for (const [module, imports] of this._externalModules.entries()) {
      const clauses = imports.filter((x) => ts.isImportClause(x)) as ts.ImportClause[];
      const specifiers = imports.filter((x) => ts.isImportSpecifier(x)) as ts.ImportSpecifier[];

      for (const clause of clauses) {
        this.statements.unshift(
          f.createImportDeclaration([] as ts.Modifier[], clause, f.createStringLiteral(module), undefined)
        );
      }

      this.statements.unshift(
        f.createImportDeclaration(
          [] as ts.Modifier[],
          f.createImportClause(true, undefined, f.createNamedImports(specifiers)),
          f.createStringLiteral(module),
          undefined
        )
      );
    }
  }

  private _translateTypeAlias(typeAlias: ts.Symbol): ts.TypeAliasDeclaration | undefined {
    const decl = typeAlias.declarations?.[0] as ts.TypeAliasDeclaration;

    if (!this._memoizeSymbol(typeAlias) || !decl || !ts.isTypeAliasDeclaration(decl)) {
      return undefined;
    }

    this.visitTypeParameters(decl.typeParameters);
    this.inject(decl.type);

    return f.createTypeAliasDeclaration(
      TypeUtils.withExportModifier(ts.getModifiers(decl)),
      decl.name,
      this._replacer.visitTypeParameters(decl.typeParameters),
      this._replacer.replace(decl.type)
    );
  }

  private _translateMethod(method: ts.Symbol): ts.MethodSignature[] | undefined {
    const decl = method.valueDeclaration as ts.MethodDeclaration;

    if (!this._memoizeSymbol(method) || !decl || !ts.isMethodDeclaration(decl)) {
      return undefined;
    }

    const isAsync = this._inferer.isAsync(decl);
    const decorator = this._extractor.getDecorator(method, EXPOSE_DECORATOR_NAME);
    const exposeOptions = this._extractor.getDecoratorOptions(decorator);
    const modifiers = ts.getModifiers(decl) || [];
    const typeParameters = this._replacer.visitTypeParameters(decl.typeParameters);
    const parameters = this._replacer.visitParameters(decl.parameters);
    const returnType = this._inferer.inferReturnType(decl);
    let returnTypeNode: ts.TypeNode | undefined;

    this.visitTypeParameters(decl.typeParameters);
    this.visitParameters(decl.parameters);

    if (returnType) {
      this.visitType(decl, returnType);
      returnTypeNode = this._typeChecker.typeToTypeNode(returnType, undefined, undefined);
    } else if (decl.type) {
      returnTypeNode = decl.type;
    } else {
      returnTypeNode = f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }

    if (isAsync) {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          decl.questionToken,
          typeParameters,
          parameters,
          TypeUtils.asPromise(returnTypeNode)
        ),
      ];
    } else {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          decl.questionToken,
          typeParameters,
          parameters,
          returnTypeNode
        ),
        f.createMethodSignature(
          modifiers,
          (exposeOptions.as || method.name) + "Async",
          decl.questionToken,
          typeParameters,
          parameters,
          TypeUtils.asPromise(returnTypeNode)
        ),
      ];
    }
  }

  private _translateAccessor(property: ts.Symbol): ts.MethodSignature[] | undefined {
    const decl = property.declarations?.[0] as ts.PropertyDeclaration;

    if (!decl) {
      return undefined;
    }

    const decorator = this._extractor.getDecorator(property, ACCESSOR_DECORATOR_NAME);
    const exposeOptions = this._extractor.getDecoratorOptions(decorator);
    const declNameText = exposeOptions.as || decl.name.getText();

    return [
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || TypeUtils.camelcase("get", declNameText),
        undefined,
        undefined,
        [],
        this._replacer.replace(decl.type)
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || TypeUtils.camelcase("get", declNameText, "async"),
        undefined,
        undefined,
        [],
        this._replacer.replace(TypeUtils.asPromise(decl.type))
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || TypeUtils.camelcase("set", declNameText),
        undefined,
        undefined,
        [
          f.createParameterDeclaration(
            undefined,
            undefined,
            declNameText,
            undefined,
            this._replacer.replace(decl.type),
            undefined
          ),
        ],
        f.createTypeReferenceNode("void")
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || TypeUtils.camelcase("set", declNameText, "async"),
        undefined,
        undefined,
        [
          f.createParameterDeclaration(
            undefined,
            undefined,
            declNameText,
            undefined,
            this._replacer.replace(decl.type),
            undefined
          ),
        ],
        TypeUtils.asPromise(f.createTypeReferenceNode("void"))
      ),
    ];
  }

  private _translateProperty(property: ts.Symbol): ts.PropertySignature | undefined {
    const decl = property.valueDeclaration as ts.PropertyDeclaration | ts.ParameterDeclaration;
    const modifiers = ts.getModifiers(decl);

    this.inject(decl.type);

    return f.createPropertySignature(modifiers, property.name, decl.questionToken, this._replacer.replace(decl.type));
  }

  private _translateMembers(isInjectable: boolean, members: ts.Symbol[]): ts.TypeElement[] {
    const result: ts.TypeElement[] = [];

    for (const member of members) {
      const decl = member.valueDeclaration;

      if (!decl) {
        continue;
      }

      let type: ts.TypeElement | ts.TypeElement[] | undefined;

      if (isInjectable && ts.isMethodDeclaration(decl)) {
        type = this._translateMethod(member);
      } else if (isInjectable && ts.isPropertyDeclaration(decl)) {
        type = this._translateAccessor(member);
      } else {
        type = this._translateProperty(member);
      }

      type && (Array.isArray(type) ? result.push(...type) : result.push(type));
    }

    return result;
  }

  private _translateHeritageClauses(c: ts.Symbol): ts.HeritageClause[] {
    const decl = c.valueDeclaration as ts.ClassDeclaration;

    if (!decl || !(ts.isClassDeclaration(decl) || ts.isInterfaceDeclaration(decl))) {
      return [];
    }

    const heritageClauses: ts.HeritageClause[] = [];
    const isInjectable = this._extractor.hasDecorator(c, INJECTABLE_DECORATOR_NAME);

    for (const heritageClause of decl?.heritageClauses || []) {
      if (heritageClause.token !== ts.SyntaxKind.ExtendsKeyword) {
        continue;
      }

      const heritageClauseTypes: ts.ExpressionWithTypeArguments[] = [];

      for (const expression of heritageClause.types) {
        const type = this._typeChecker.getTypeAtLocation(expression);

        if (!isInjectable || (isInjectable && this._extractor.hasDecorator(type.symbol, INJECTABLE_DECORATOR_NAME))) {
          this.inject(expression);
          heritageClauseTypes.push(expression);
        }
      }

      if (heritageClauseTypes.length) {
        heritageClauses.push(f.createHeritageClause(heritageClause.token, heritageClauseTypes));
      }
    }

    return heritageClauses;
  }

  private _translateInterface(symbol: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = (symbol.valueDeclaration || symbol.declarations?.[0]) as ts.InterfaceDeclaration;

    if (!decl) {
      return undefined;
    }

    this.visitTypeParameters(decl.typeParameters);

    const props = decl.members.filter((x) => ts.isPropertySignature(x));
    const propSymbols = props.map((x) => (x?.name ? this._typeChecker.getSymbolAtLocation(x.name) : undefined));
    const members = propSymbols.map((x) => (x ? this._translateProperty(x) : undefined));

    if (this._memoizeSymbol(symbol)) {
      return f.createInterfaceDeclaration(
        TypeUtils.withExportModifier(ts.getModifiers(decl)),
        decl.name,
        this._replacer.visitTypeParameters(decl.typeParameters),
        this._translateHeritageClauses(symbol),
        members.filter((x) => !!x) as ts.PropertySignature[]
      );
    }

    return undefined;
  }

  private _translateClass(c: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = c.valueDeclaration as ts.ClassDeclaration;

    if (!this._memoizeSymbol(c) || !decl || !ts.isClassDeclaration(decl)) {
      return undefined;
    }

    const modifiers: readonly ts.Modifier[] = TypeUtils.withExportModifier(ts.getModifiers(decl));
    const heritageClauses: ts.HeritageClause[] = this._translateHeritageClauses(c);
    const isInjectable = this._extractor.hasDecorator(c, INJECTABLE_DECORATOR_NAME);
    const members = this._translateMembers(isInjectable, this._extractor.getClassMembers(c));

    this.visitTypeParameters(decl.typeParameters);

    return f.createInterfaceDeclaration(
      modifiers,
      c.name,
      this._replacer.visitTypeParameters(decl.typeParameters),
      heritageClauses,
      members
    );
  }

  protected _injectSymbol(symbol: ts.Symbol) {
    const decl = symbol.valueDeclaration || symbol.declarations?.[0];

    if (!decl || TypeUtils.isExternalModule(decl)) {
      return;
    }

    let node: ts.Statement | undefined;

    if (ts.isClassDeclaration(decl)) {
      node = this._translateClass(symbol);
    } else if (ts.isInterfaceDeclaration(decl)) {
      node = this._translateInterface(symbol);
    } else if (ts.isTypeAliasDeclaration(decl)) {
      node = this._translateTypeAlias(symbol);
    }

    node && (Array.isArray(node) ? this.statements.push(...node) : this.statements.push(node));
  }

  private _translateGlobalDeclarations() {
    const globalDeclaration = f.createModuleDeclaration(
      [f.createModifier(ts.SyntaxKind.DeclareKeyword)],
      f.createIdentifier("global"),
      f.createModuleBlock(
        this._injectables.map((x) => {
          const injectableDecorator = this._extractor.getDecorator(x, INJECTABLE_DECORATOR_NAME);
          const options = this._extractor.getDecoratorOptions(injectableDecorator);

          return f.createVariableStatement(undefined, [
            f.createVariableDeclaration(
              options.as || TypeUtils.camelcase(x.name),
              undefined,
              f.createTypeReferenceNode(x.name),
              undefined
            ),
          ]);
        })
      ),
      ts.NodeFlags.GlobalAugmentation
    );

    return globalDeclaration;
  }

  private _translate(): void {
    for (const injectable of this._injectables) {
      const decl = this._translateClass(injectable);

      decl && this.statements.push(decl);
    }

    this.statements.push(this._translateGlobalDeclarations());

    this._insertImportDeclarations();
  }

  execute(): string {
    this.statements.length = 0;
    this._injectables.length = 0;
    this._injectables.push(...this._extractor.getInjectables());

    this._translate();

    const tsSourceFile = f.createSourceFile(
      this.statements,
      f.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    );

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

    return printer.printFile(tsSourceFile);
  }
}
