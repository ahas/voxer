import ts from "typescript";
import { resolve } from "path";
import { Extractor } from "./extractor";
import { ACCESSOR_DECORATOR_NAME, EXPOSE_DECORATOR_NAME, INJECTABLE_DECORATOR_NAME } from "./constants";

const f = ts.factory;

export class Translator {
  private _program: ts.Program;
  private _typeChecker: ts.TypeChecker;
  private _statements: ts.Statement[] = [];
  private _injectables: ts.Symbol[] = [];
  private _extractor: Extractor;
  private _memoizedSymbols: Map<string, ts.Symbol> = new Map();
  private _externalModules: Map<string, (ts.ImportSpecifier | ts.ImportClause)[]> = new Map();

  constructor(cwd: string) {
    const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

    if (!configFile) {
      throw Error("tsconfig.json not found");
    }

    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, resolve(cwd, "src"));

    this._program = ts.createProgram({
      options,
      rootNames: fileNames,
      configFileParsingDiagnostics: errors,
    });
    this._typeChecker = this._program.getTypeChecker();
    this._extractor = new Extractor(this._program, cwd);
  }

  private memoizeSymbol(symbol: ts.Symbol): boolean {
    const symbolName = this._typeChecker.symbolToString(symbol);

    if (this._memoizedSymbols.has(symbolName)) {
      return false;
    }

    this._memoizedSymbols.set(symbolName, symbol);

    return true;
  }

  private camelcase(s: string, ...strs: string[]) {
    let result = s[0].toLowerCase() + s.substring(1);

    for (const str of strs) {
      result += str[0].toUpperCase() + str.substring(1);
    }

    return result;
  }

  private isPromiseTypeNode(type?: ts.Type | string): boolean {
    return typeof type === "string" ? type === "Promise" : !!type && this._typeChecker.typeToString(type) === "Promise";
  }

  private getReturnType(decl: ts.MethodDeclaration): ts.Type | undefined {
    const signature = this._typeChecker.getSignatureFromDeclaration(decl);

    if (signature) {
      const returnType = this._typeChecker.getReturnTypeOfSignature(signature);

      return returnType;
    }

    return undefined;
  }

  private inferReturnType(decl: ts.MethodDeclaration): ts.TypeNode | undefined {
    if (decl.type) {
      return decl.type;
    }

    const returnType = this.getReturnType(decl);

    if (!returnType) {
      return undefined;
    }

    return this._typeChecker.typeToTypeNode(returnType, decl.type, undefined) || f.createTypeReferenceNode("any");
  }

  private isAsync(decl: ts.MethodDeclaration): boolean {
    return (
      !!ts.getModifiers(decl)?.find((x) => x.getText() === "async") || this.isPromiseTypeNode(this.getReturnType(decl))
    );
  }

  private isPromise(typeNode: ts.TypeNode | undefined): boolean {
    if (!typeNode) {
      return false;
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      if (ts.isIdentifier(typeNode.typeName)) {
        return typeNode.typeName.escapedText === "Promise";
      }
    }

    return false;
  }

  private asPromise(typeNode: ts.TypeNode | undefined): ts.TypeNode {
    if (typeNode && this.isPromise(typeNode)) {
      return typeNode;
    }

    return f.createTypeReferenceNode("Promise", [typeNode || f.createTypeReferenceNode("any")]);
  }

  private translateType(typeNode: ts.TypeNode | undefined): ts.TypeNode {
    if (!typeNode) {
      return f.createTypeReferenceNode("any");
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      if (typeNode.typeArguments) {
        return f.createTypeReferenceNode(
          typeNode.typeName,
          typeNode.typeArguments.map((t) => this.translateType(t))
        );
      }

      if (ts.isIdentifier(typeNode.typeName)) {
        const typeName = typeNode.typeName.escapedText;

        switch (typeName) {
          case "Buffer":
            return f.createTypeReferenceNode("Uint8Array");
        }
      }
    }

    return typeNode;
  }

  private translateTypeAlias(typeAlias: ts.Symbol): ts.TypeAliasDeclaration | undefined {
    const decl = typeAlias.declarations?.[0] as ts.TypeAliasDeclaration;

    if (!this.memoizeSymbol(typeAlias) || !decl || !ts.isTypeAliasDeclaration(decl)) {
      return undefined;
    }

    this.visitTypeParameters(decl.typeParameters);
    this.visitTypeReference(decl.type);

    return decl;
  }

  private isSymbolInLib(symbol: ts.Symbol): boolean {
    return (
      symbol?.getDeclarations()?.some((s) => {
        const { fileName } = s.getSourceFile();

        return fileName.includes("/node_modules/typescript/lib/") || fileName.includes("/node_modules/@types/node/");
      }) ?? false
    );
  }

  private isExternalModule(decl: ts.Declaration) {
    const sourceFile = decl.getSourceFile();

    return !sourceFile || sourceFile.isDeclarationFile || sourceFile.fileName.includes("/node_modules/");
  }

  private visitSymbol(symbol: ts.Symbol) {
    const decl = symbol.valueDeclaration || symbol.declarations?.[0];

    if (!decl || this.isExternalModule(decl)) {
      return;
    }

    if (ts.isClassDeclaration(decl)) {
      const classDecl = this.translateClass(symbol);

      classDecl && this._statements.push(classDecl);
    } else if (ts.isInterfaceDeclaration(decl)) {
      const interfaceDecl = this.translateInterface(symbol);

      interfaceDecl && this._statements.push(interfaceDecl);
    } else if (ts.isTypeAliasDeclaration(decl)) {
      const aliasTypeDecl = this.translateTypeAlias(symbol);

      aliasTypeDecl && this._statements.push(aliasTypeDecl);
    }
  }

  private getModuleSpecifier(decl: ts.ImportSpecifier | ts.ImportClause): string | undefined {
    let moduleSpecifier: ts.Expression | undefined;

    if (ts.isImportClause(decl)) {
      moduleSpecifier = decl.parent.moduleSpecifier;
    } else if (ts.isImportSpecifier(decl)) {
      moduleSpecifier = decl.parent.parent.parent.moduleSpecifier;
    } else {
      moduleSpecifier = undefined;
    }

    if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
      return moduleSpecifier.text;
    }

    return undefined;
  }

  private pushExternalModule(module: string, decl: ts.ImportSpecifier | ts.ImportClause): void {
    if (!this._externalModules.has(module)) {
      this._externalModules.set(module, []);
    }

    this._externalModules.get(module)?.push(decl);
  }

  private insertImportDeclarations() {
    for (const [module, imports] of this._externalModules.entries()) {
      const clauses = imports.filter((x) => ts.isImportClause(x)) as ts.ImportClause[];
      const specifiers = imports.filter((x) => ts.isImportSpecifier(x)) as ts.ImportSpecifier[];

      for (const clause of clauses) {
        this._statements.unshift(
          f.createImportDeclaration([] as ts.Modifier[], clause, f.createStringLiteral(module), undefined)
        );
      }

      this._statements.unshift(
        f.createImportDeclaration(
          [] as ts.Modifier[],
          f.createImportClause(true, undefined, f.createNamedImports(specifiers)),
          f.createStringLiteral(module),
          undefined
        )
      );
    }
  }

  private visitExternalTypeReference(typeNode: ts.TypeReferenceNode) {
    const decl = this._typeChecker.getSymbolAtLocation(typeNode.typeName)?.declarations?.[0];

    if (decl && (ts.isImportSpecifier(decl) || ts.isImportClause(decl))) {
      const from = this.getModuleSpecifier(decl);

      from && this.pushExternalModule(from, decl);
    }
  }

  private visitTypeReference(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return;
    }

    const type = this._typeChecker.getTypeFromTypeNode(typeNode);
    const symbol = type.symbol || type.aliasSymbol;

    if (symbol && this.isSymbolInLib(symbol)) {
      return;
    } else if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
      typeNode.types.forEach((x) => this.visitTypeReference(x));
    } else if (ts.isTypeReferenceNode(typeNode)) {
      if (symbol) {
        const symbolDecl = symbol.valueDeclaration || symbol.declarations?.[0];

        if (symbolDecl && this.isExternalModule(symbolDecl)) {
          this.visitExternalTypeReference(typeNode);
        }
      }

      typeNode.typeArguments?.forEach((arg) => arg.end !== -1 && this.visitTypeReference(arg));
    }

    symbol && this.visitSymbol(symbol);
  }

  private translateMethod(method: ts.Symbol): ts.MethodSignature[] | undefined {
    const decl = method.valueDeclaration as ts.MethodDeclaration;

    if (!this.memoizeSymbol(method) || !decl || !ts.isMethodDeclaration(decl)) {
      return undefined;
    }

    const isAsync = this.isAsync(decl);
    const decorator = this._extractor.getDecorator(method, EXPOSE_DECORATOR_NAME);
    const exposeOptions = this._extractor.getDecoratorOptions(decorator);
    const modifiers = ts.getModifiers(decl) || [];
    this.visitTypeParameters(decl.typeParameters);
    this.visitParameters(decl.parameters);
    const returnType = this.inferReturnType(decl);

    this.visitTypeReference(returnType);

    if (isAsync) {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          decl.questionToken,
          decl.typeParameters,
          decl.parameters,
          this.translateType(this.asPromise(returnType))
        ),
      ];
    } else {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          decl.questionToken,
          decl.typeParameters,
          decl.parameters,
          this.translateType(returnType)
        ),
        f.createMethodSignature(
          modifiers,
          (exposeOptions.as || method.name) + "Async",
          decl.questionToken,
          decl.typeParameters,
          decl.parameters,
          this.translateType(this.asPromise(returnType))
        ),
      ];
    }
  }

  private translateAccessor(property: ts.Symbol): ts.MethodSignature[] | undefined {
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
        exposeOptions.getter || this.camelcase("get", declNameText),
        undefined,
        undefined,
        [],
        this.translateType(decl.type)
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || this.camelcase("get", declNameText, "async"),
        undefined,
        undefined,
        [],
        this.translateType(this.asPromise(decl.type))
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || this.camelcase("set", declNameText),
        undefined,
        undefined,
        [f.createParameterDeclaration(undefined, undefined, declNameText, undefined, decl.type, undefined)],
        f.createTypeReferenceNode("void")
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || this.camelcase("set", declNameText, "async"),
        undefined,
        undefined,
        [f.createParameterDeclaration(undefined, undefined, declNameText, undefined, decl.type, undefined)],
        this.asPromise(f.createTypeReferenceNode("void"))
      ),
    ];
  }

  private translateProperty(property: ts.Symbol): ts.PropertySignature | undefined {
    const decl = property.valueDeclaration as ts.PropertyDeclaration | ts.ParameterDeclaration;

    if (!this.memoizeSymbol(property) || !decl) {
      return undefined;
    }

    const modifiers = ts.getModifiers(decl);

    return f.createPropertySignature(modifiers, property.name, decl.questionToken, this.translateType(decl.type));
  }

  private translateMembers(members: ts.Symbol[]) {
    const result: ts.TypeElement[] = [];

    for (const member of members) {
      const decl = member.valueDeclaration;

      if (!decl) {
        continue;
      }

      if (ts.isMethodDeclaration(decl)) {
        const method = this.translateMethod(member);

        method && result.push(...method);
      } else if (ts.isPropertyDeclaration(decl)) {
        const accessors = this.translateAccessor(member);

        accessors && result.push(...accessors);
      } else {
        const prop = this.translateProperty(member);

        prop && result.push(prop);
      }
    }

    return result;
  }

  private visitTypeParameters(typeParams: ts.NodeArray<ts.TypeParameterDeclaration> | undefined): void {
    typeParams?.forEach((tp) => {
      this.visitTypeReference(tp.constraint);
      this.visitTypeReference(tp.default);

      if (tp.expression && ts.isExpressionWithTypeArguments(tp.expression)) {
        this.visitTypeReference(tp.expression);
      }
    });
  }

  private visitParameters(params: ts.NodeArray<ts.ParameterDeclaration> | undefined): void {
    params?.forEach((p) => {
      this.visitTypeReference(p.type);
    });
  }

  private translateHeritageClauses(c: ts.Symbol): ts.HeritageClause[] {
    const decl = c.valueDeclaration as ts.ClassDeclaration;

    if (!decl || !ts.isClassDeclaration(decl)) {
      return [];
    }

    const heritageClauses: ts.HeritageClause[] = [];
    const heritageClauseTypes: ts.ExpressionWithTypeArguments[] = [];
    const isInjectable = this._extractor.hasDecorator(c, INJECTABLE_DECORATOR_NAME);

    for (const heritageClause of decl?.heritageClauses || []) {
      for (const expression of heritageClause.types) {
        const type = this._typeChecker.getTypeAtLocation(expression);

        if (
          !isInjectable ||
          (isInjectable && type?.symbol && this._extractor.hasDecorator(type.symbol, INJECTABLE_DECORATOR_NAME))
        ) {
          this.visitTypeReference(expression);
          heritageClauseTypes.push(expression);
        }
      }
    }

    if (heritageClauseTypes.length) {
      heritageClauses.push(f.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, heritageClauseTypes));
    }

    return heritageClauses;
  }

  private translateInterface(symbol: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = symbol.valueDeclaration as ts.InterfaceDeclaration;

    this.visitTypeParameters(decl.typeParameters);

    if (this.memoizeSymbol(symbol)) {
      return decl;
    }

    return undefined;
  }

  private translateClass(c: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = c.valueDeclaration as ts.ClassDeclaration;

    if (!this.memoizeSymbol(c) || !decl || !ts.isClassDeclaration(decl)) {
      return undefined;
    }

    const modifiers: readonly ts.Modifier[] = ts.getModifiers(decl) || [];
    const heritageClauses: ts.HeritageClause[] = this.translateHeritageClauses(c);
    const members = this.translateMembers(this._extractor.getClassMembers(c));

    this.visitTypeParameters(decl.typeParameters);

    return f.createInterfaceDeclaration(modifiers, c.name, decl.typeParameters, heritageClauses, members);
  }

  private translateGlobalDeclarations() {
    const globalDeclaration = f.createModuleDeclaration(
      [f.createModifier(ts.SyntaxKind.DeclareKeyword)],
      f.createIdentifier("global"),
      f.createModuleBlock(
        this._injectables.map((x) => {
          const injectableDecorator = this._extractor.getDecorator(x, INJECTABLE_DECORATOR_NAME);
          const options = this._extractor.getDecoratorOptions(injectableDecorator);

          return f.createVariableStatement(undefined, [
            f.createVariableDeclaration(
              options.as || this.camelcase(x.name),
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

  private translate(): void {
    for (const injectable of this._injectables) {
      const decl = this.translateClass(injectable);

      decl && this._statements.push(decl);
    }

    this._statements.push(this.translateGlobalDeclarations());

    this.insertImportDeclarations();
  }

  execute(): string {
    this._statements.length = 0;
    this._injectables.length = 0;
    this._injectables.push(...this._extractor.getInjectables());

    this.translate();

    const tsSourceFile = f.createSourceFile(
      this._statements,
      f.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    );
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

    return printer.printFile(tsSourceFile);
  }
}
