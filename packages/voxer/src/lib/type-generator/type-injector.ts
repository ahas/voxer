import * as ts from "typescript";
import { TypeVisitor } from "./type-visitor";

const f = ts.factory;

export abstract class TypeInjector implements TypeVisitor<void> {
  readonly statements: ts.Statement[] = [];
  readonly externalModules: Map<string, (ts.ImportSpecifier | ts.ImportClause)[]> = new Map();

  protected readonly _program: ts.Program;
  protected readonly _typeChecker: ts.TypeChecker;

  constructor(program: ts.Program) {
    this._program = program;
    this._typeChecker = program.getTypeChecker();
  }

  private pushExternalModule(module: string, decl: ts.ImportSpecifier | ts.ImportClause): void {
    if (!this.externalModules.has(module)) {
      this.externalModules.set(module, []);
    }

    this.externalModules.get(module)?.push(decl);
  }

  private isTypeReference(type: ts.Type): type is ts.TypeReference {
    return "typeArguments" in type;
  }

  visitType(currentNode: ts.Node, type: ts.Type | undefined) {
    if (!type) {
      return;
    }

    const symbol = type.symbol || type.aliasSymbol;

    if (type.isClassOrInterface()) {
      type.typeParameters?.forEach((x) => this.visitType(currentNode, x));
      type.outerTypeParameters?.forEach((x) => this.visitType(currentNode, x));
      type.localTypeParameters?.forEach((x) => this.visitType(currentNode, x));
      this.visitType(currentNode, type.thisType);
    } else if (type.isUnionOrIntersection()) {
      type.types?.forEach((x) => this.visitType(currentNode, x));
    } else if (type.isIndexType()) {
      this.visitType(currentNode, type.type);
    }

    if (this.isTypeReference(type)) {
      type.typeArguments?.forEach((x) => this.visitType(currentNode, x));
    }

    // if (symbol) {
    //   const symbolDecl = symbol.valueDeclaration || symbol.declarations?.[0];

    //   if (symbolDecl && TypeUtils.isExternalModule(symbolDecl)) {
    //     const decl = this.getImportClauseOrSpecifier(type, currentNode);

    //     if (decl) {
    //       const from = TypeUtils.getModuleSpecifier(decl);

    //       from && this.pushExternalModule(from, decl);
    //     }
    //   }
    // }

    symbol && this.injectSymbol(symbol);
  }

  visitLiteralType(typeNode: ts.LiteralTypeNode): void {}

  visitFunctionType(typeNode: ts.FunctionTypeNode): void {
    this.visitTypeParameters(typeNode.typeParameters);
    this.visitParameters(typeNode.parameters);
    this.inject(typeNode.type);
  }

  visitTypeReference(typeNode: ts.TypeReferenceNode): void {
    const type = this._typeChecker.getTypeFromTypeNode(typeNode);

    typeNode.typeArguments?.forEach((arg) => arg.end !== -1 && this.inject(arg));
    this.visitType(typeNode, type);
  }

  visitArrayType(typeNode: ts.ArrayTypeNode): void {
    this.inject(typeNode.elementType);
  }

  visitTupleType(typeNode: ts.TupleTypeNode): void {
    typeNode.elements.forEach((x) => this.inject(x));
  }

  visitTypeOperator(typeNode: ts.TypeOperatorNode): void {
    this.inject(typeNode.type);
  }

  visitThisType(typeNode: ts.ThisTypeNode): void {}

  visitTypePredicate(typeNode: ts.TypePredicateNode): void {
    this.inject(typeNode.type);
  }

  visitRestType(typeNode: ts.RestTypeNode): void {
    this.inject(typeNode.type);
  }

  visitTypeQuery(queryType: ts.TypeQueryNode): void {
    queryType.typeArguments?.forEach((x) => this.inject(x));

    const type = this._typeChecker.getTypeAtLocation(queryType);

    if (type) {
      const typeNode = this._typeChecker.typeToTypeNode(type, undefined, undefined);

      if (typeNode) {
        this.inject(typeNode);
      }
    }
  }

  visitTypeParameter(typeNode: ts.TypeParameterDeclaration): void {
    this.inject(typeNode.constraint);
    this.inject(typeNode.default);

    if (typeNode.expression && ts.isExpressionWithTypeArguments(typeNode.expression)) {
      this.inject(typeNode.expression);
    }
  }

  visitTypeParameters(typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined): void {
    typeParameters?.forEach((x) => this.visitTypeParameter(x));
  }

  visitParameter(parameter: ts.ParameterDeclaration): void {
    this.inject(parameter.type);
  }

  visitParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>): void {
    parameters?.forEach((p) => this.visitParameter(p));
  }

  visitInferType(typeNode: ts.InferTypeNode): void {
    typeNode.typeParameter && this.visitTypeParameter(typeNode.typeParameter);
  }

  visitUnionType(typeNode: ts.UnionTypeNode): void {
    typeNode.types.forEach((x) => this.inject(x));
  }

  visitImportType(typeNode: ts.ImportTypeNode): void {
    this.inject(typeNode.argument);
    typeNode.typeArguments?.forEach((x) => this.inject(x));
  }

  visitMappedType(typeNode: ts.MappedTypeNode): void {
    this.inject(typeNode.nameType);
    this.inject(typeNode.type);
    this.visitTypeParameter(typeNode.typeParameter);
  }

  visitOptionalType(typeNode: ts.OptionalTypeNode): void {
    this.inject(typeNode.type);
  }

  visitConditionalType(typeNode: ts.ConditionalTypeNode): void {
    this.inject(typeNode.checkType);
    this.inject(typeNode.extendsType);
    this.inject(typeNode.trueType);
    this.inject(typeNode.falseType);
  }

  visitConstructorType(typeNode: ts.ConstructorTypeNode): void {
    this.visitTypeParameters(typeNode.typeParameters);
    this.visitParameters(typeNode.parameters);
    this.inject(typeNode.type);
  }

  visitIntersectionType(typeNode: ts.IntersectionTypeNode): void {
    typeNode.types.forEach((x) => this.inject(x));
  }

  visitIndexedAccessType(typeNode: ts.IndexedAccessTypeNode): void {
    this.inject(typeNode.indexType);
    this.inject(typeNode.objectType);
  }

  visitParenthesizedType(typeNode: ts.ParenthesizedTypeNode): void {
    this.inject(typeNode.type);
  }

  visitTemplateLiteralType(typeNode: ts.TemplateLiteralTypeNode): void {
    typeNode.templateSpans.forEach((x) => this.inject(x.type));
  }

  inject(typeNode: ts.TypeNode | undefined): void {
    if (!typeNode) {
      return;
    }

    if (ts.isThisTypeNode(typeNode)) {
      return this.visitThisType(typeNode);
    } else if (ts.isTypeOperatorNode(typeNode)) {
      return this.visitTypeOperator(typeNode);
    } else if (ts.isTypePredicateNode(typeNode)) {
      return this.visitTypePredicate(typeNode);
    } else if (ts.isTypeReferenceNode(typeNode)) {
      return this.visitTypeReference(typeNode);
    } else if (ts.isTupleTypeNode(typeNode)) {
      return this.visitTupleType(typeNode);
    } else if (ts.isRestTypeNode(typeNode)) {
      return this.visitRestType(typeNode);
    } else if (ts.isArrayTypeNode(typeNode)) {
      return this.visitArrayType(typeNode);
    } else if (ts.isTypeQueryNode(typeNode)) {
      return this.visitTypeQuery(typeNode);
    } else if (ts.isInferTypeNode(typeNode)) {
      return this.visitInferType(typeNode);
    } else if (ts.isUnionTypeNode(typeNode)) {
      return this.visitUnionType(typeNode);
    } else if (ts.isImportTypeNode(typeNode)) {
      return this.visitImportType(typeNode);
    } else if (ts.isMappedTypeNode(typeNode)) {
      return this.visitMappedType(typeNode);
    } else if (ts.isLiteralTypeNode(typeNode)) {
      return this.visitLiteralType(typeNode);
    } else if (ts.isFunctionTypeNode(typeNode)) {
      return this.visitFunctionType(typeNode);
    } else if (ts.isOptionalTypeNode(typeNode)) {
      return this.visitOptionalType(typeNode);
    } else if (ts.isConditionalTypeNode(typeNode)) {
      return this.visitConditionalType(typeNode);
    } else if (ts.isConstructorTypeNode(typeNode)) {
      return this.visitConstructorType(typeNode);
    } else if (ts.isIntersectionTypeNode(typeNode)) {
      return this.visitIntersectionType(typeNode);
    } else if (ts.isIndexedAccessTypeNode(typeNode)) {
      return this.visitIndexedAccessType(typeNode);
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      return this.visitParenthesizedType(typeNode);
    } else if (ts.isTemplateLiteralTypeNode(typeNode)) {
      return this.visitTemplateLiteralType(typeNode);
    }
  }

  protected abstract injectSymbol(symbol: ts.Symbol): void;
}
