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

  static withExportModifier(modifiers: readonly ts.Modifier[] | undefined): readonly ts.Modifier[] {
    if (!modifiers) {
      return [f.createToken(ts.SyntaxKind.ExportKeyword)];
    }

    if (modifiers.some((x) => x.kind === ts.SyntaxKind.ExportKeyword)) {
      return modifiers;
    }

    return [f.createToken(ts.SyntaxKind.ExportKeyword), ...modifiers];
  }
}
