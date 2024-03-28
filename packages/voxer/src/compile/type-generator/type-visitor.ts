import ts from "typescript";

type TypeNodeOrVoid<T2 extends ts.TypeNode, T1 = ts.TypeNode | void> = T1 extends ts.TypeNode ? T2 : void;

export interface TypeVisitor<T = ts.TypeNode> {
  visitTypeReference(typeNode: ts.TypeReferenceNode): TypeNodeOrVoid<ts.TypeNode, T>;
  visitArrayType(typeNode: ts.ArrayTypeNode): TypeNodeOrVoid<ts.ArrayTypeNode, T>;
  visitTupleType(typeNode: ts.TupleTypeNode): TypeNodeOrVoid<ts.TupleTypeNode, T>;
  visitTypeOperator(typeNode: ts.TypeOperatorNode): TypeNodeOrVoid<ts.TypeOperatorNode, T>;
  visitThisType(typeNode: ts.ThisTypeNode): TypeNodeOrVoid<ts.ThisTypeNode, T>;
  visitTypePredicate(typeNode: ts.TypePredicateNode): TypeNodeOrVoid<ts.TypePredicateNode, T>;
  visitRestType(typeNode: ts.RestTypeNode): TypeNodeOrVoid<ts.RestTypeNode, T>;
  visitTypeQuery(typeNode: ts.TypeQueryNode): TypeNodeOrVoid<ts.TypeQueryNode, T>;
  visitTypeParameter(
    typeNode: ts.TypeParameterDeclaration
  ): T extends ts.TypeNode ? ts.TypeParameterDeclaration | undefined : void;
  visitTypeParameters(
    typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined
  ): T extends ts.TypeNode ? ts.TypeParameterDeclaration[] | undefined : void;
  visitParameter(parameter: ts.ParameterDeclaration): T extends ts.TypeNode ? ts.ParameterDeclaration : void;
  visitParameters(
    parameters: ts.NodeArray<ts.ParameterDeclaration>
  ): T extends ts.TypeNode ? ts.ParameterDeclaration[] : void;
  visitInferType(typeNode: ts.InferTypeNode): TypeNodeOrVoid<ts.InferTypeNode, T>;
  visitUnionType(typeNode: ts.UnionTypeNode): TypeNodeOrVoid<ts.UnionTypeNode, T>;
  visitImportType(typeNode: ts.ImportTypeNode): TypeNodeOrVoid<ts.ImportTypeNode, T>;
  visitMappedType(typeNode: ts.MappedTypeNode): TypeNodeOrVoid<ts.MappedTypeNode, T>;
  visitOptionalType(typeNode: ts.OptionalTypeNode): TypeNodeOrVoid<ts.OptionalTypeNode, T>;
  visitConditionalType(typeNode: ts.ConditionalTypeNode): TypeNodeOrVoid<ts.ConditionalTypeNode, T>;
  visitConstructorType(typeNode: ts.ConstructorTypeNode): TypeNodeOrVoid<ts.ConstructorTypeNode, T>;
  visitIntersectionType(typeNode: ts.IntersectionTypeNode): TypeNodeOrVoid<ts.IntersectionTypeNode, T>;
  visitIndexedAccessType(typeNode: ts.IndexedAccessTypeNode): TypeNodeOrVoid<ts.IndexedAccessTypeNode, T>;
  visitParenthesizedType(typeNode: ts.ParenthesizedTypeNode): TypeNodeOrVoid<ts.ParenthesizedTypeNode, T>;
  visitTemplateLiteralType(typeNode: ts.TemplateLiteralTypeNode): TypeNodeOrVoid<ts.TemplateLiteralTypeNode, T>;
  visitLiteralType(typeNode: ts.LiteralTypeNode): TypeNodeOrVoid<ts.LiteralTypeNode, T>;
  visitFunctionType(typeNode: ts.FunctionTypeNode): TypeNodeOrVoid<ts.FunctionTypeNode, T>;
}
