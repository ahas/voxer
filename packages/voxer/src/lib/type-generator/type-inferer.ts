import ts from "typescript";

const f = ts.factory;

export class TypeInferer {
  private _typeChecker: ts.TypeChecker;

  constructor(program: ts.Program) {
    this._typeChecker = program.getTypeChecker();
  }

  private getReturnType(decl: ts.MethodDeclaration): ts.Type | undefined {
    const signature = this._typeChecker.getSignatureFromDeclaration(decl);

    if (signature) {
      const returnType = this._typeChecker.getReturnTypeOfSignature(signature);

      return returnType;
    }

    return undefined;
  }

  private isPromiseType(type?: ts.Type | string): boolean {
    return typeof type === "string" ? type === "Promise" : !!type && this._typeChecker.typeToString(type) === "Promise";
  }

  private isPromiseTypeNode(typeNode: ts.TypeNode | undefined): boolean {
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

  isAsync(decl: ts.MethodDeclaration): boolean {
    return (
      !!ts.getModifiers(decl)?.find((x) => x.getText() === "async") || this.isPromiseType(this.getReturnType(decl))
    );
  }

  isSymbolInTsLib(symbol: ts.Symbol): boolean {
    return (
      symbol?.getDeclarations()?.some((s) => {
        const { fileName } = s.getSourceFile();

        return fileName.includes("/node_modules/typescript/lib/") || fileName.includes("/node_modules/@types/node/");
      }) ?? false
    );
  }

  isExternalModule(decl: ts.Declaration) {
    const sourceFile = decl.getSourceFile();

    return !sourceFile || sourceFile.isDeclarationFile || sourceFile.fileName.includes("/node_modules/");
  }

  asPromise(typeNode: ts.TypeNode | undefined): ts.TypeNode {
    if (typeNode && this.isPromiseTypeNode(typeNode)) {
      return typeNode;
    }

    return f.createTypeReferenceNode("Promise", [typeNode || f.createTypeReferenceNode("any")]);
  }

  inferReturnType(methodDecl: ts.MethodDeclaration): ts.TypeNode | undefined {
    if (methodDecl.type) {
      if (ts.isTypeQueryNode(methodDecl.type)) {
        const type = this._typeChecker.getTypeAtLocation(methodDecl.type);
        const typeNode = this._typeChecker.typeToTypeNode(type, undefined, undefined);

        if (typeNode) {
          return typeNode;
        }
      }

      return methodDecl.type;
    }

    const returnType = this.getReturnType(methodDecl);

    if (!returnType) {
      return f.createTypeReferenceNode("any");
    }

    return this._typeChecker.typeToTypeNode(returnType, undefined, undefined) || f.createTypeReferenceNode("any");
  }
}
