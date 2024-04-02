import ts from "typescript";

const f = ts.factory;

export class TypeUtils {
  static camelcase(s: string, ...strs: string[]) {
    let result = s[0].toLowerCase() + s.substring(1);

    for (const str of strs) {
      result += str[0].toUpperCase() + str.substring(1);
    }

    return result;
  }

  static getModuleSpecifier(decl: ts.ImportSpecifier | ts.ImportClause): string | undefined {
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

  static withExportModifier(modifiers: readonly ts.Modifier[] | undefined): readonly ts.Modifier[] {
    if (!modifiers) {
      return [f.createToken(ts.SyntaxKind.ExportKeyword)];
    }

    if (modifiers.some((x) => x.kind === ts.SyntaxKind.ExportKeyword)) {
      return modifiers;
    }

    return [f.createToken(ts.SyntaxKind.ExportKeyword), ...modifiers];
  }

  static isSymbolInTsLib(symbol: ts.Symbol): boolean {
    return (
      symbol?.getDeclarations()?.some((s) => {
        const { fileName } = s.getSourceFile();

        return fileName.includes("/node_modules/typescript/lib/") || fileName.includes("/node_modules/@types/node/");
      }) ?? false
    );
  }

  static isExternalModule(decl: ts.Declaration) {
    const sourceFile = decl.getSourceFile();

    return !sourceFile || sourceFile.isDeclarationFile || sourceFile.fileName.includes("/node_modules/");
  }

  static isPromiseTypeNode(typeNode: ts.TypeNode | undefined): boolean {
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

  static asPromise(typeNode: ts.TypeNode | undefined): ts.TypeNode {
    if (typeNode && this.isPromiseTypeNode(typeNode)) {
      return typeNode;
    }

    return f.createTypeReferenceNode("Promise", [typeNode || f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]);
  }
}
