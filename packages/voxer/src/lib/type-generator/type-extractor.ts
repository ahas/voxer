import * as ts from "typescript";
import { resolve } from "path";
import { INJECTABLE_DECORATOR_NAME, EXPOSE_DECORATOR_NAME, ACCESSOR_DECORATOR_NAME } from "./constants";

export class TypeExtractor {
  private _program: ts.Program;
  private _typeChecker: ts.TypeChecker;
  private _DECORATORS_FILE_NAME: string;

  constructor(program: ts.Program, cwd: string) {
    this._program = program;
    this._typeChecker = program.getTypeChecker();
    this._DECORATORS_FILE_NAME = resolve(cwd, ".voxer/runtime/core/decorators.d.ts");
  }

  getExportsOfSourceFile(sourceFile: ts.SourceFile): ts.Symbol[] {
    const symbol = this._typeChecker.getSymbolAtLocation(sourceFile);

    if (symbol) {
      return this._typeChecker.getExportsOfModule(symbol);
    }

    return [];
  }

  getDecorator(symbol: ts.Symbol, decoratorName: string): ts.Decorator | undefined {
    if (!symbol?.valueDeclaration || !ts.canHaveDecorators(symbol.valueDeclaration)) {
      return undefined;
    }

    const decl = symbol.valueDeclaration;
    const decorators = this.getDecoratorsOfDeclaration(decl);

    if (!decorators) {
      return undefined;
    }

    for (const decorator of decorators) {
      const decoratorImportName = this.getDecoratorImportName(decorator);
      const decoratorSourceFile = this.getDecoratorSourceFile(decorator);

      if (decoratorImportName === decoratorName && decoratorSourceFile.fileName === this._DECORATORS_FILE_NAME) {
        return decorator;
      }
    }

    return undefined;
  }

  hasDecorator(symbol: ts.Symbol, ...decoratorNames: string[]): boolean {
    return decoratorNames.map((x) => this.getDecorator(symbol, x)).filter((x) => !!x).length > 0;
  }

  getObjectLiteralProperties(expression: ts.Expression | undefined): ts.NodeArray<ts.ObjectLiteralElementLike> | null {
    if (!expression) {
      return null;
    }

    if (ts.isObjectLiteralExpression(expression)) {
      return expression.properties;
    } else if (ts.isIdentifier(expression)) {
      const symbol = this._typeChecker.getSymbolAtLocation(expression);
      const decl = symbol?.valueDeclaration;

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

  getDecoratorsOfDeclaration(declaration: ts.Declaration | undefined): readonly ts.Decorator[] {
    if (declaration && ts.canHaveDecorators(declaration)) {
      return ts.getDecorators(declaration) || [];
    }

    return [];
  }

  getDecoratorImportName(decorator: ts.Decorator): string {
    const decoratorToken = decorator.expression.getFirstToken()!;
    const decoratorSymbol = this._typeChecker.getSymbolAtLocation(decoratorToken);
    const decoratorDeclaration = decoratorSymbol?.declarations?.[0] as ts.ImportSpecifier;

    return decoratorDeclaration?.propertyName?.text || decoratorDeclaration?.name.text;
  }

  getDecoratorSourceFile(decorator: ts.Decorator): ts.SourceFile {
    const importSymbol = this._typeChecker.getSymbolAtLocation(decorator.expression.getFirstToken()!)!;
    const aliasedSymbol = this._typeChecker.getAliasedSymbol(importSymbol);
    const declaration = aliasedSymbol.declarations?.[0] as ts.VariableDeclaration;

    return declaration.getSourceFile();
  }

  getSymbolsByDecorators(symbols: ts.Symbol[], ...decoratorNames: string[]): ts.Symbol[] {
    return symbols.filter((s) => this.hasDecorator(s, ...decoratorNames));
  }

  getInjectables(): ts.Symbol[] {
    const injectables: ts.Symbol[] = [];

    for (const sourceFile of this._program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) {
        continue;
      }

      const classes = this.getExportsOfSourceFile(sourceFile).filter(
        (x) => x.valueDeclaration && ts.isClassDeclaration(x.valueDeclaration)
      );
      injectables.push(...this.getSymbolsByDecorators(classes, INJECTABLE_DECORATOR_NAME));
    }

    return injectables;
  }

  private getExposedMembers(c: ts.Symbol): ts.Symbol[] {
    const members: ts.Symbol[] = [];

    c.members?.forEach((m) => members.push(m));

    return this.getSymbolsByDecorators(members, EXPOSE_DECORATOR_NAME, ACCESSOR_DECORATOR_NAME);
  }

  private getPublicProperties(c: ts.Symbol): ts.Symbol[] {
    const members: ts.Symbol[] = [];

    c.members?.forEach((m) => {
      const decl = m.valueDeclaration;

      if (!decl || !(ts.isPropertyDeclaration(decl) || ts.isParameter(decl))) {
        return;
      }

      const modifiers = ts.getModifiers(decl)?.map((x) => x.getText()) || [];

      if (modifiers?.some((x) => x === "private" || x === "protected")) {
        return;
      }

      members.push(m);
    });

    return members;
  }

  getClassMembers(c: ts.Symbol): ts.Symbol[] {
    const isInjectable = this.hasDecorator(c, INJECTABLE_DECORATOR_NAME);

    return isInjectable ? this.getExposedMembers(c) : this.getPublicProperties(c);
  }
}
