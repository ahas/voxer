import ts, { Declaration } from "typescript";
import fs from "fs";
import { resolve } from "path";

const f = ts.factory;
const cwd = process.cwd();

const INJECTABLE_DECORATOR_NAME = "Injectable";
const EXPOSE_DECORATOR_NAME = "Expose";
const ACCESSOR_DECORATOR_NAME = "Accessor";
const IMPORTS_FILE_NAME = resolve(cwd, ".voxer/runtime/core/decorators.d.ts");

function isClassType(type: ts.Type): boolean {
  return type.symbol?.declarations?.[0].kind === ts.SyntaxKind.ClassDeclaration;
}

function isInterfaceType(type: ts.Type): boolean {
  return type.symbol?.declarations?.[0].kind === ts.SyntaxKind.InterfaceDeclaration;
}

function isPromise(type?: ts.TypeNode | string) {
  if (type && ts.isTypeReferenceNode(type as ts.TypeNode)) {
    const typeNode = type as ts.TypeNode;

    return typeNode.getFirstToken()?.getText() === "Promise";
  }

  return false;
}

function getTypeAnyway(type?: ts.TypeNode | string) {
  return typeof type === "string" ? f.createTypeReferenceNode(type) : type || f.createTypeReferenceNode("any");
}

function asPromise(type?: ts.TypeNode | string) {
  if (isPromise(type)) {
    return type as ts.TypeNode as ts.TypeReferenceNode;
  }

  return f.createTypeReferenceNode("Promise", [getTypeAnyway()]);
}

function camelcase(s: string, ...strs: string[]) {
  let result = s[0].toLowerCase() + s.substring(1);

  for (const str of strs) {
    result += str[0].toUpperCase() + str.substring(1);
  }

  return result;
}

export class Extractor {
  private _tsProgram: ts.Program;
  private _tsChecker: ts.TypeChecker;

  constructor(tsProgram: ts.Program) {
    this._tsProgram = tsProgram;
    this._tsChecker = tsProgram.getTypeChecker();
  }

  getExportsOfSourceFile(sourceFile: ts.SourceFile): ts.Symbol[] {
    const symbol = this._tsChecker.getSymbolAtLocation(sourceFile);

    if (symbol) {
      return this._tsChecker.getExportsOfModule(symbol);
    }

    return [];
  }

  getDeclarationDecorators(declaration: ts.Declaration | undefined): readonly ts.Decorator[] {
    if (declaration && ts.canHaveDecorators(declaration)) {
      return ts.getDecorators(declaration) || [];
    }

    return [];
  }

  getDecoratorImportName(decorator: ts.Decorator): string {
    const decoratorToken = decorator.expression.getFirstToken()!;
    const decoratorSymbol = this._tsChecker.getSymbolAtLocation(decoratorToken);
    const decoratorDeclaration = decoratorSymbol?.declarations?.[0] as ts.ImportSpecifier;

    return decoratorDeclaration?.propertyName?.text || decoratorDeclaration?.name.text;
  }

  getDecoratorSourceFile(decorator: ts.Decorator): ts.SourceFile {
    const importSymbol = this._tsChecker.getSymbolAtLocation(decorator.expression.getFirstToken()!)!;
    const aliasedSymbol = this._tsChecker.getAliasedSymbol(importSymbol);
    const declaration = aliasedSymbol.declarations?.[0] as ts.VariableDeclaration;
    const imports = importSymbol.declarations?.[0]?.parent.parent;

    return declaration.getSourceFile();
  }

  getObjectLiteralProperties(expression: ts.Expression | undefined): ts.NodeArray<ts.ObjectLiteralElementLike> | null {
    if (!expression) {
      return null;
    }

    if (ts.isObjectLiteralExpression(expression)) {
      return expression.properties;
    } else if (ts.isIdentifier(expression)) {
      const symbol = this._tsChecker.getSymbolAtLocation(expression);
      const decl = symbol?.declarations?.[0];

      if (
        decl &&
        ts.isVariableDeclaration(decl) &&
        decl.initializer &&
        ts.isObjectLiteralExpression(decl.initializer)
      ) {
        return decl.initializer.properties;
      }
    }

    return null;
  }

  getDecoratorOptions(decorator: ts.Decorator | undefined): Record<string, any> {
    if (!decorator || !ts.isCallExpression(decorator.expression)) {
      return {};
    }

    const optionsExpr = decorator.expression.arguments?.[0];
    const props: ts.NodeArray<ts.ObjectLiteralElementLike> | null = this.getObjectLiteralProperties(optionsExpr);

    if (props) {
      const options: Record<string, any> = {};

      for (const prop of props) {
        const propName = prop.name?.getText();

        if (propName && ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.initializer)) {
          options[propName] = prop.initializer.text;
        }
      }

      return options;
    }

    return {};
  }

  isDecoratedWith(decorators: readonly ts.Decorator[], decoratorNames: string[]): boolean {
    for (const decorator of decorators) {
      const decoratorImportName = this.getDecoratorImportName(decorator);
      const decoratorSourceFile = this.getDecoratorSourceFile(decorator);

      for (const decoratorName of decoratorNames) {
        if (decoratorImportName === decoratorName && decoratorSourceFile.fileName === IMPORTS_FILE_NAME) {
          return true;
        }
      }
    }

    return false;
  }

  getDecoratedSymbols(symbols: ts.Symbol[], decoratorNames: string[]): ts.Symbol[] {
    const result: ts.Symbol[] = [];

    for (const symbol of symbols) {
      const declaration = symbol.declarations?.[0];
      const decorators = this.getDeclarationDecorators(declaration);

      if (this.isDecoratedWith(decorators, decoratorNames)) {
        result.push(symbol);
      }
    }

    return result;
  }

  getDecoratedClasses(symbols: ts.Symbol[], decoratorNames: string[]): ts.Symbol[] {
    return this.getDecoratedSymbols(symbols, decoratorNames).filter((x) => {
      return x.declarations?.[0].kind === ts.SyntaxKind.ClassDeclaration;
    });
  }

  getDecorator(decl: Declaration | undefined, decoratorName: string): ts.Decorator | undefined {
    if (!decl || !ts.canHaveDecorators(decl)) {
      return undefined;
    }

    const decorators = ts.getDecorators(decl);

    if (!decorators) {
      return undefined;
    }

    for (const decorator of decorators) {
      const decoratorImportName = this.getDecoratorImportName(decorator);
      const decoratorSourceFile = this.getDecoratorSourceFile(decorator);

      if (decoratorImportName === decoratorName && decoratorSourceFile.fileName === IMPORTS_FILE_NAME) {
        return decorator;
      }
    }

    return undefined;
  }

  getInjectedClasses(): ts.Symbol[] {
    const classes: ts.Symbol[] = [];

    for (const sourceFile of this._tsProgram.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) {
        continue;
      }

      const exports = this.getExportsOfSourceFile(sourceFile);
      const injectedClasses = this.getDecoratedClasses(exports, [INJECTABLE_DECORATOR_NAME]);

      classes.push(...injectedClasses);
    }

    return classes;
  }

  getSymbolMembers(symbol: ts.Symbol) {
    const members: ts.Symbol[] = [];

    symbol.members?.forEach((member) => members.push(member));

    return members;
  }

  createExposedMethodSignatures(method: ts.Symbol): ts.MethodSignature[] {
    const decl = method.declarations?.[0];

    if (!decl || !ts.isMethodDeclaration(decl)) {
      return [];
    }
    const isAsync = !!ts.getModifiers(decl)?.find((x) => x.getText() === "async") || isPromise(decl.type);
    const modifiers: readonly ts.Modifier[] | undefined = ts.getModifiers(decl)?.filter((x) => x.getText() !== "async");
    const questionToken: ts.QuestionToken | undefined = decl.questionToken;
    const decorator = this.getDecorator(decl, EXPOSE_DECORATOR_NAME);
    const exposeOptions = this.getDecoratorOptions(decorator);

    if (isAsync) {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          questionToken,
          decl.typeParameters,
          decl.parameters,
          asPromise(decl.type)
        ),
      ];
    } else {
      return [
        f.createMethodSignature(
          modifiers,
          exposeOptions.as || method.name,
          questionToken,
          decl.typeParameters,
          decl.parameters,
          getTypeAnyway(decl.type)
        ),
        f.createMethodSignature(
          modifiers,
          (exposeOptions.as || method.name) + "Async",
          questionToken,
          decl.typeParameters,
          decl.parameters,
          asPromise(decl.type)
        ),
      ];
    }
  }

  createAccessorSignatures(property: ts.Symbol): ts.MethodSignature[] | null {
    const decl = property.declarations?.[0] as ts.PropertyDeclaration;

    if (!decl) {
      return null;
    }

    const decorator = this.getDecorator(decl, ACCESSOR_DECORATOR_NAME);
    const exposeOptions = this.getDecoratorOptions(decorator);
    const declNameText = decl.name.getText();

    return [
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || camelcase("get", exposeOptions.as || declNameText),
        undefined,
        undefined,
        [],
        getTypeAnyway(decl.type)
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.getter || camelcase("get", exposeOptions.as || declNameText, "async"),
        undefined,
        undefined,
        [],
        asPromise(decl.type)
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || camelcase("set", exposeOptions.as || declNameText),
        undefined,
        undefined,
        [f.createParameterDeclaration(undefined, undefined, decl.name.getText(), undefined, decl.type, undefined)],
        f.createTypeReferenceNode("void")
      ),
      f.createMethodSignature(
        undefined,
        exposeOptions.setter || camelcase("set", exposeOptions.as || declNameText, "async"),
        undefined,
        undefined,
        [
          f.createParameterDeclaration(
            undefined,
            undefined,
            decl.name.getText(),
            undefined,
            decl.type,
            undefined
          ),
        ],
        asPromise("void")
      ),
    ];
  }

  exposeMembers(injectedClass: ts.Symbol): ts.TypeElement[] {
    const members: ts.TypeElement[] = [];
    const symbolMembers = this.getSymbolMembers(injectedClass);
    const exposedMembers = this.getDecoratedSymbols(symbolMembers, [EXPOSE_DECORATOR_NAME, ACCESSOR_DECORATOR_NAME]);

    for (const member of exposedMembers) {
      switch (member.declarations?.[0].kind) {
        case ts.SyntaxKind.MethodDeclaration: {
          const signatures = this.createExposedMethodSignatures(member);
          signatures && members.push(...signatures);
          break;
        }
        case ts.SyntaxKind.PropertyDeclaration: {
          const signatures = this.createAccessorSignatures(member);
          signatures && members.push(...signatures);
          break;
        }
      }
    }

    return members;
  }
}

export class ClassToInterfaceTransformer {
  private _tsProgram: ts.Program;
  private _tsChecker: ts.TypeChecker;
  private _extractor: Extractor;
  private _injectedClasses: ts.Symbol[] = [];
  private _transformedSymbols: Map<string, ts.Symbol> = new Map();
  private _statements: ts.Statement[] = [];

  get injectedClasses(): ts.Symbol[] {
    return this._injectedClasses;
  }

  get typeChecker(): ts.TypeChecker {
    return this._tsChecker;
  }

  constructor() {
    const configFile = ts.findConfigFile(resolve(cwd, "src"), ts.sys.fileExists, "tsconfig.json");

    if (!configFile) {
      throw Error("tsconfig.json not found");
    }

    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, resolve(cwd, "src"));

    this._tsProgram = ts.createProgram({ options, rootNames: fileNames, configFileParsingDiagnostics: errors });
    this._tsChecker = this._tsProgram.getTypeChecker();
    this._extractor = new Extractor(this._tsProgram);
    this._statements = [];
  }

  memoizeSymbol(symbol: ts.Symbol): boolean {
    const symbolName = this._tsChecker.symbolToString(symbol);

    if (this._transformedSymbols.has(symbolName)) {
      return false;
    }

    this._transformedSymbols.set(symbolName, symbol);

    return true;
  }

  transformType(node: ts.TypeNode): void {
    const type = this._tsChecker.getTypeFromTypeNode(node);
    const isInLibFiles =
      type.symbol
        ?.getDeclarations()
        ?.some((s) => s.getSourceFile().fileName.includes("/node_modules/typescript/lib/")) ?? false;

    if (isInLibFiles) {
      return;
    }

    if (ts.isTypeReferenceNode(node)) {
      for (const arg of node.typeArguments || []) {
        this.transformType(arg);
      }

      const symbol = this._tsChecker.getSymbolAtLocation(node.typeName);

      if (symbol) {
        const decl = symbol?.declarations?.[0] as ts.TypeAliasDeclaration;

        this.transformTypeParameters(decl.typeParameters);

        if (decl && ts.isTypeAliasDeclaration(decl) && this.memoizeSymbol(symbol)) {
          this._statements.push(
            f.createTypeAliasDeclaration(undefined, ts.getModifiers(decl), decl.name, decl.typeParameters, decl.type)
          );
        }
      }
    }

    if (isClassType(type)) {
      this.transformClass(type.symbol);
    } else if (isInterfaceType(type)) {
      this.transformInterface(type.symbol);
    }
  }

  transformInterface(symbol: ts.Symbol) {
    const decl = symbol.declarations![0] as ts.InterfaceDeclaration;
    this.transformTypeParameters(decl.typeParameters);

    if (this.memoizeSymbol(symbol)) {
      this._statements.push(decl);
    }
  }

  transformTypeParameters(params: ts.NodeArray<ts.TypeParameterDeclaration> | undefined) {
    if (params) {
      for (const typeParameter of params) {
        if (typeParameter.constraint) {
          this.transformType(typeParameter.constraint);
        }
        if (typeParameter.default) {
          this.transformType(typeParameter.default);
        }
        if (typeParameter.expression && ts.isExpressionWithTypeArguments(typeParameter.expression)) {
          this.transformType(typeParameter.expression);
        }
      }
    }
  }

  transformMethod(method: ts.MethodSignature): void {
    for (const p of method.parameters) {
      if (p.type) {
        this.transformType(p.type);
      }
    }

    this.transformTypeParameters(method.typeParameters);

    if (method.type) {
      this.transformType(method.type);
    }
  }

  transformClass(classSymbol: ts.Symbol): void {
    const decl = classSymbol.declarations?.[0]! as ts.ClassDeclaration;
    this.transformTypeParameters(decl.typeParameters);

    if (!this.memoizeSymbol(classSymbol)) {
      return;
    }

    const members: ts.TypeElement[] = this._extractor.exposeMembers(classSymbol);

    for (const member of members) {
      if (ts.isMethodSignature(member)) {
        this.transformMethod(member);
      }
    }

    const modifiers: readonly ts.Modifier[] | undefined = ts.getModifiers(decl);
    const typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined = decl.typeParameters;
    const heritageClauses: ts.HeritageClause[] = [];
    const heritageClauseTypes: ts.ExpressionWithTypeArguments[] = [];

    for (const heritageClause of decl?.heritageClauses || []) {
      for (const expression of heritageClause.types) {
        this.transformType(expression);
      }

      heritageClauseTypes.push(...heritageClause.types);
    }

    if (heritageClauseTypes.length) {
      heritageClauses.push(f.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, heritageClauseTypes));
    }

    this._statements.push(
      f.createInterfaceDeclaration(modifiers, classSymbol.name, typeParameters, heritageClauses, members)
    );
  }

  createGlobalDeclarations() {
    const globalDeclaration = f.createModuleDeclaration(
      [f.createModifier(ts.SyntaxKind.DeclareKeyword)],
      f.createIdentifier("global"),
      f.createModuleBlock(
        this._injectedClasses.map((x) => {
          const injectableDecorator = this._extractor.getDecorator(x.declarations?.[0], INJECTABLE_DECORATOR_NAME);
          const options = this._extractor.getDecoratorOptions(injectableDecorator);

          return f.createVariableStatement(undefined, [
            f.createVariableDeclaration(
              options.as || camelcase(x.name),
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

  transform(): ts.Statement[] {
    this._statements.length = 0;
    this._injectedClasses.length = 0;
    this._injectedClasses.push(...this._extractor.getInjectedClasses());

    for (const injectedClass of this._injectedClasses) {
      this.transformClass(injectedClass);
    }

    this._statements.push(this.createGlobalDeclarations());

    return this._statements;
  }
}

export function transform() {
  const outputFileName = resolve(cwd, ".voxer/api.d.ts");

  if (fs.existsSync(outputFileName)) {
    fs.unlinkSync(outputFileName);
  }

  const transformer = new ClassToInterfaceTransformer();
  const statements = transformer.transform();
  const source = f.createSourceFile(statements, f.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  fs.writeFileSync(outputFileName, printer.printFile(source));
}
