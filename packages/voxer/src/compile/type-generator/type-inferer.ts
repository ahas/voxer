import ts from "typescript";

const f = ts.factory;

export class TypeInferer {
  private _typeChecker: ts.TypeChecker;

  constructor(program: ts.Program) {
    this._typeChecker = program.getTypeChecker();
  }

  private _getReturnType(decl: ts.MethodDeclaration): ts.Type | undefined {
    const signature = this._typeChecker.getSignatureFromDeclaration(decl);

    if (signature) {
      const returnType = this._typeChecker.getReturnTypeOfSignature(signature);

      return returnType;
    }

    return undefined;
  }

  private _isPromiseType(type?: ts.Type | string): boolean {
    return typeof type === "string" ? type === "Promise" : !!type && this._typeChecker.typeToString(type) === "Promise";
  }

  isAsync(decl: ts.MethodDeclaration): boolean {
    return (
      !!ts.getModifiers(decl)?.find((x) => x.getText() === "async") || this._isPromiseType(this._getReturnType(decl))
    );
  }

  inferReturnType(methodDecl: ts.MethodDeclaration): ts.Type | undefined {
    if (methodDecl.type) {
      const type = this._typeChecker.getTypeAtLocation(methodDecl.type);

      if (type) {
        return type;
      }
    }

    return this._getReturnType(methodDecl) || undefined;
  }
}
