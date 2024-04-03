import ts from "typescript";
import { TypeVisitor } from "./type-visitor";

const f = ts.factory;

export class TypeReplacer implements TypeVisitor<ts.TypeNode> {
  createAlternativeType(typeName: ts.__String): ts.TypeNode | undefined {
    switch (typeName) {
      case "Buffer":
        return f.createTypeReferenceNode("Uint8Array");
      case "Function":
        return f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
    }

    return undefined;
  }

  visitAlternativeType(typeRef: ts.TypeReferenceNode | undefined): ts.TypeNode {
    if (!typeRef) {
      return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }

    if (!ts.isIdentifier(typeRef.typeName)) {
      return typeRef;
    }

    const typeName = typeRef.typeName.escapedText;

    return this.createAlternativeType(typeName) || typeRef;
  }

  visitLiteralType(typeNode: ts.LiteralTypeNode) {
    let literal: ts.NullLiteral | ts.BooleanLiteral | ts.LiteralExpression | ts.PrefixUnaryExpression | undefined =
      undefined;

    switch (typeNode.literal.kind) {
      case ts.SyntaxKind.StringLiteral:
        literal = f.createStringLiteral(typeNode.literal.text);
        break;
      case ts.SyntaxKind.NumericLiteral:
        literal = f.createNumericLiteral(typeNode.literal.text);
        break;
      case ts.SyntaxKind.TrueKeyword:
        literal = f.createTrue();
        break;
      case ts.SyntaxKind.FalseKeyword:
        literal = f.createFalse();
        break;
      case ts.SyntaxKind.NullKeyword:
        literal = f.createNull();
        break;
      default:
        literal = typeNode.literal;
        break;
    }

    if (literal) {
      return f.createLiteralTypeNode(literal);
    }

    return typeNode;
  }

  visitTypeReference(typeNode: ts.TypeReferenceNode) {
    if (typeNode.typeArguments) {
      return f.createTypeReferenceNode(
        typeNode.typeName,
        typeNode.typeArguments.map((t) => this.replace(t))
      );
    }

    if (ts.isIdentifier(typeNode.typeName)) {
      return this.visitAlternativeType(typeNode);
    }

    return typeNode;
  }

  visitArrayType(typeNode: ts.ArrayTypeNode): ts.ArrayTypeNode {
    return f.createArrayTypeNode(this.replace(typeNode.elementType));
  }

  visitTupleType(typeNode: ts.TupleTypeNode) {
    return f.createTupleTypeNode(typeNode.elements.map((x) => this.replace(x)));
  }

  visitTypeOperator(typeNode: ts.TypeOperatorNode) {
    return f.createTypeOperatorNode(typeNode.operator, this.replace(typeNode));
  }

  visitThisType(typeNode: ts.ThisTypeNode) {
    return f.createThisTypeNode();
  }

  visitTypePredicate(typeNode: ts.TypePredicateNode) {
    return f.createTypePredicateNode(typeNode.assertsModifier, typeNode.parameterName, this.replace(typeNode.type));
  }

  visitRestType(typeNode: ts.RestTypeNode) {
    return f.createRestTypeNode(this.replace(typeNode.type));
  }

  visitTypeQuery(typeNode: ts.TypeQueryNode) {
    return f.createTypeQueryNode(
      typeNode.exprName,
      typeNode.typeArguments?.map((x) => this.replace(x))
    );
  }

  visitTypeParameter(typeNode: ts.TypeParameterDeclaration) {
    return f.createTypeParameterDeclaration(
      ts.getModifiers(typeNode),
      typeNode.name,
      this.replace(typeNode.constraint),
      this.replace(typeNode.default)
    );
  }

  visitTypeParameters(typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined) {
    return typeParameters?.map((x) => this.visitTypeParameter(x));
  }

  visitParameter(parameter: ts.ParameterDeclaration) {
    return f.createParameterDeclaration(
      ts.getModifiers(parameter),
      parameter.dotDotDotToken,
      parameter.name,
      parameter.questionToken,
      this.replace(parameter.type),
      parameter.initializer
    );
  }

  visitParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
    return parameters.map((x) => this.visitParameter(x));
  }

  visitInferType(typeNode: ts.InferTypeNode) {
    return f.createInferTypeNode(this.visitTypeParameter(typeNode.typeParameter));
  }

  visitUnionType(typeNode: ts.UnionTypeNode) {
    return f.createUnionTypeNode(typeNode.types.map((x) => this.replace(x)));
  }

  visitImportType(typeNode: ts.ImportTypeNode) {
    return f.createImportTypeNode(
      this.replace(typeNode.argument),
      typeNode.attributes,
      typeNode.qualifier,
      typeNode.typeArguments?.map((x) => this.replace(x))
    );
  }

  visitMappedType(typeNode: ts.MappedTypeNode) {
    return f.createMappedTypeNode(
      typeNode.readonlyToken,
      this.visitTypeParameter(typeNode.typeParameter),
      this.replace(typeNode.nameType),
      typeNode.questionToken,
      this.replace(typeNode.type),
      typeNode.members
    );
  }

  visitFunctionType(typeNode: ts.FunctionTypeNode) {
    return f.createFunctionTypeNode(
      this.visitTypeParameters(typeNode.typeParameters),
      this.visitParameters(typeNode.parameters),
      this.replace(typeNode.type)
    );
  }

  visitOptionalType(typeNode: ts.OptionalTypeNode) {
    return f.createOptionalTypeNode(this.replace(typeNode));
  }

  visitConditionalType(typeNode: ts.ConditionalTypeNode) {
    return f.createConditionalTypeNode(
      this.replace(typeNode.checkType),
      this.replace(typeNode.extendsType),
      this.replace(typeNode.trueType),
      this.replace(typeNode.falseType)
    );
  }

  visitConstructorType(typeNode: ts.ConstructorTypeNode) {
    return f.createConstructorTypeNode(
      ts.getModifiers(typeNode),
      this.visitTypeParameters(typeNode.typeParameters),
      this.visitParameters(typeNode.parameters),
      this.replace(typeNode)
    );
  }

  visitIntersectionType(typeNode: ts.IntersectionTypeNode) {
    return f.createIntersectionTypeNode(typeNode.types.map((x) => this.replace(x)));
  }

  visitIndexedAccessType(typeNode: ts.IndexedAccessTypeNode) {
    return f.createIndexedAccessTypeNode(this.replace(typeNode.objectType), this.replace(typeNode.indexType));
  }

  visitParenthesizedType(typeNode: ts.ParenthesizedTypeNode) {
    return f.createParenthesizedType(this.replace(typeNode.type));
  }

  visitTemplateLiteralType(typeNode: ts.TemplateLiteralTypeNode) {
    return f.createTemplateLiteralType(
      typeNode.head,
      typeNode.templateSpans.map((x) => f.createTemplateLiteralTypeSpan(this.replace(x.type), x.literal))
    );
  }

  replace(typeNode: ts.TypeNode | undefined): ts.TypeNode {
    if (!typeNode) {
      return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
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

    return typeNode;
  }
}
