import ts from "typescript";
import { resolve } from "path";
import { TypeExtractor } from "./type-extractor";
import { ACCESSOR_DECORATOR_NAME, EXPOSE_DECORATOR_NAME, INJECTABLE_DECORATOR_NAME } from "./constants";
import { TypeInferer } from "./type-inferer";
import { TypeUtils } from "./type-utils";

const f = ts.factory;

export class TypeTranslator {
  private _program: ts.Program;
  private _typeChecker: ts.TypeChecker;
  private _statements: ts.Statement[] = [];
  private _injectables: ts.Symbol[] = [];
  private _extractor: TypeExtractor;
  private _inferer: TypeInferer;
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
    this._extractor = new TypeExtractor(this._program, cwd);
    this._inferer = new TypeInferer(this._program);
  }

  private memoizeSymbol(symbol: ts.Symbol): boolean {
    const symbolName = this._typeChecker.symbolToString(symbol);

    if (this._memoizedSymbols.has(symbolName)) {
      return false;
    }

    this._memoizedSymbols.set(symbolName, symbol);

    return true;
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

  private visitTypeParameter(tp: ts.TypeParameterDeclaration) {
    this.visitTypeReference(tp.constraint);
    this.visitTypeReference(tp.default);

    if (tp.expression && ts.isExpressionWithTypeArguments(tp.expression)) {
      this.visitTypeReference(tp.expression);
    }
  }

  private visitTypeParameters(typeParams: ts.NodeArray<ts.TypeParameterDeclaration> | undefined): void {
    typeParams?.forEach((tp) => this.visitTypeParameter(tp));
  }

  private visitTypeArguments(args: ts.NodeArray<ts.TypeNode> | undefined) {
    args?.forEach((arg) => this.visitTypeReference(arg));
  }

  private visitSymbol(symbol: ts.Symbol) {
    const decl = symbol.valueDeclaration || symbol.declarations?.[0];

    if (!decl || this._inferer.isExternalModule(decl)) {
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

  private visitExternalTypeReference(typeNode: ts.TypeReferenceNode) {
    const decl = this._typeChecker.getSymbolAtLocation(typeNode.typeName)?.declarations?.[0];

    if (decl && (ts.isImportSpecifier(decl) || ts.isImportClause(decl))) {
      const from = this._extractor.getModuleSpecifier(decl);

      from && this.pushExternalModule(from, decl);
    }
  }

  private visitUnionOrIntersectionType(t: ts.UnionOrIntersectionTypeNode) {
    t.types.forEach((x) => this.visitTypeReference(x));
  }

  private visitConditionalType(ct: ts.ConditionalTypeNode) {
    this.visitTypeReference(ct.checkType);
    this.visitTypeReference(ct.extendsType);
    this.visitTypeReference(ct.trueType);
    this.visitTypeReference(ct.falseType);
  }

  private visitTypeQuery(tq: ts.TypeQueryNode): void {
    this.visitTypeArguments(tq.typeArguments);

    const type = this._typeChecker.getTypeAtLocation(tq);

    if (type) {
      const typeNode = this._typeChecker.typeToTypeNode(type, undefined, undefined);

      if (typeNode) {
        this.visitTypeReference(typeNode);
      }
    }
  }

  private visitTypeReference(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return;
    }

    const type = this._typeChecker.getTypeFromTypeNode(typeNode);
    const symbol = type.symbol || type.aliasSymbol;

    if (ts.isArrayTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.elementType);
    } else if (ts.isTupleTypeNode(typeNode)) {
      typeNode.elements.forEach((e) => this.visitTypeReference(e));
    } else if (symbol && this._inferer.isSymbolInTsLib(symbol)) {
      return;
    } else if (ts.isOptionalTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.type);
    } else if (ts.isTypeOperatorNode(typeNode)) {
      this.visitTypeReference(typeNode.type);
    } else if (ts.isTypePredicateNode(typeNode)) {
      this.visitTypeReference(typeNode.type);
    } else if (ts.isRestTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.type);
    } else if (ts.isInferTypeNode(typeNode)) {
      this.visitTypeParameter(typeNode.typeParameter);
    } else if (ts.isMappedTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.nameType);
      this.visitTypeParameter(typeNode.typeParameter);
      this.visitTypeReference(typeNode.type);
    } else if (ts.isIndexedAccessTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.indexType);
      this.visitTypeReference(typeNode.objectType);
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      this.visitTypeReference(typeNode.type);
    } else if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
      this.visitUnionOrIntersectionType(typeNode);
    } else if (ts.isConditionalTypeNode(typeNode)) {
      this.visitConditionalType(typeNode);
    } else if (ts.isInferTypeNode(typeNode)) {
      this.visitTypeParameter(typeNode.typeParameter);
    } else if (ts.isTypeQueryNode(typeNode)) {
      this.visitTypeQuery(typeNode);
    } else if (ts.isTypeReferenceNode(typeNode)) {
      if (symbol) {
        const symbolDecl = symbol.valueDeclaration || symbol.declarations?.[0];

        if (symbolDecl && this._inferer.isExternalModule(symbolDecl)) {
          this.visitExternalTypeReference(typeNode);
        }
      }

      typeNode.typeArguments?.forEach((arg) => arg.end !== -1 && this.visitTypeReference(arg));
    }

    symbol && this.visitSymbol(symbol);
  }

  private visitParameters(params: ts.NodeArray<ts.ParameterDeclaration> | undefined): void {
    params?.forEach((p) => {
      this.visitTypeReference(p.type);
    });
  }

  private translateTypeAlias(typeAlias: ts.Symbol): ts.TypeAliasDeclaration | undefined {
    const decl = typeAlias.declarations?.[0] as ts.TypeAliasDeclaration;

    if (!this.memoizeSymbol(typeAlias) || !decl || !ts.isTypeAliasDeclaration(decl)) {
      return undefined;
    }

    this.visitTypeParameters(decl.typeParameters);
    this.visitTypeReference(decl.type);

    return f.createTypeAliasDeclaration(
      TypeUtils.withExportModifier(ts.getModifiers(decl)),
      decl.name,
      decl.typeParameters,
      decl.type
    );
  }

  private createAlternativeType(typeName: ts.__String): ts.TypeReferenceNode | undefined {
    switch (typeName) {
      case "Buffer":
        return f.createTypeReferenceNode("Uint8Array");
    }

    return undefined;
  }

  private translateAlternativeType(typeRef: ts.TypeReferenceNode | undefined): ts.TypeReferenceNode {
    if (!typeRef) {
      return f.createTypeReferenceNode("any");
    }

    if (!ts.isIdentifier(typeRef.typeName)) {
      return typeRef;
    }

    const typeName = typeRef.typeName.escapedText;

    return this.createAlternativeType(typeName) || typeRef;
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
        return this.translateAlternativeType(typeNode);
      }
    }

    return typeNode;
  }

  private translateMethod(method: ts.Symbol): ts.MethodSignature[] | undefined {
    const decl = method.valueDeclaration as ts.MethodDeclaration;

    if (!this.memoizeSymbol(method) || !decl || !ts.isMethodDeclaration(decl)) {
      return undefined;
    }

    const isAsync = this._inferer.isAsync(decl);
    const decorator = this._extractor.getDecorator(method, EXPOSE_DECORATOR_NAME);
    const exposeOptions = this._extractor.getDecoratorOptions(decorator);
    const modifiers = ts.getModifiers(decl) || [];
    this.visitTypeParameters(decl.typeParameters);
    this.visitParameters(decl.parameters);

    const returnType = this._inferer.inferReturnType(decl);

    decl.type ? this.visitTypeReference(decl.type) : this.visitTypeReference(returnType);

    if (isAsync) {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          decl.questionToken,
          decl.typeParameters,
          decl.parameters,
          this.translateType(this._inferer.asPromise(returnType))
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
          this.translateType(this._inferer.asPromise(returnType))
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
        exposeOptions.getter || TypeUtils.camelcase("get", declNameText),
        undefined,
        undefined,
        [],
        this.translateType(decl.type)
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || TypeUtils.camelcase("get", declNameText, "async"),
        undefined,
        undefined,
        [],
        this.translateType(this._inferer.asPromise(decl.type))
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || TypeUtils.camelcase("set", declNameText),
        undefined,
        undefined,
        [f.createParameterDeclaration(undefined, undefined, declNameText, undefined, decl.type, undefined)],
        f.createTypeReferenceNode("void")
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || TypeUtils.camelcase("set", declNameText, "async"),
        undefined,
        undefined,
        [f.createParameterDeclaration(undefined, undefined, declNameText, undefined, decl.type, undefined)],
        this._inferer.asPromise(f.createTypeReferenceNode("void"))
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

  private translateHeritageClauses(c: ts.Symbol): ts.HeritageClause[] {
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
          this.visitTypeReference(expression);
          heritageClauseTypes.push(expression);
        }
      }

      if (heritageClauseTypes.length) {
        heritageClauses.push(f.createHeritageClause(heritageClause.token, heritageClauseTypes));
      }
    }

    return heritageClauses;
  }

  private translateInterface(symbol: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = (symbol.valueDeclaration || symbol.declarations?.[0]) as ts.InterfaceDeclaration;

    if (!decl) {
      return undefined;
    }

    this.visitTypeParameters(decl.typeParameters);

    if (this.memoizeSymbol(symbol)) {
      return f.createInterfaceDeclaration(
        TypeUtils.withExportModifier(ts.getModifiers(decl)),
        decl.name,
        decl.typeParameters,
        this.translateHeritageClauses(symbol),
        decl.members.filter((x) => ts.isPropertySignature(x))
      );
    }

    return undefined;
  }

  private translateClass(c: ts.Symbol): ts.InterfaceDeclaration | undefined {
    const decl = c.valueDeclaration as ts.ClassDeclaration;

    if (!this.memoizeSymbol(c) || !decl || !ts.isClassDeclaration(decl)) {
      return undefined;
    }

    const modifiers: readonly ts.Modifier[] = TypeUtils.withExportModifier(ts.getModifiers(decl));
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
