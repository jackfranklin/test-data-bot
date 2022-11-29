import ts from 'typescript';

export interface GeneratorResult {
  code: string;
}

function findTargetInterface(
  node: ts.Node,
  targetInterfaceName: string
): ts.InterfaceDeclaration | null {
  let foundNode: ts.InterfaceDeclaration | null = null;
  if (ts.isInterfaceDeclaration(node)) {
    if (node.name.escapedText === targetInterfaceName) {
      foundNode = node;
    }
  }
  if (foundNode) {
    return foundNode;
  }

  node.forEachChild((child) => {
    const maybeNode = findTargetInterface(child, targetInterfaceName);
    if (maybeNode) {
      // FIXME: should break out of the loop here
      foundNode = maybeNode;
    }
  });

  return foundNode;
}

function cannotGenerateComment(field: string): string {
  return `// ${field}: can not generate field`;
}

function generateForUnion(node: ts.UnionTypeNode): string | null {
  const allLiterals = node.types.every((unionTypeMember) => {
    return ts.isLiteralTypeNode(unionTypeMember);
  });
  if (!allLiterals) {
    return null;
  }
  const possibleValues = node.types.map((unionTypeMember) => {
    // At this point because of the allLiterals check we know this is a
    // literal type node, but this check is here to satisfy TypeScript.
    if (!ts.isLiteralTypeNode(unionTypeMember)) {
      return '';
    }
    if (ts.isStringLiteral(unionTypeMember.literal)) {
      return `'${unionTypeMember.literal.text}'`;
    } else if (ts.isNumericLiteral(unionTypeMember.literal)) {
      return unionTypeMember.literal.text;
    } else if (unionTypeMember.literal.kind === ts.SyntaxKind.TrueKeyword) {
      return 'true';
    } else if (unionTypeMember.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return 'false';
    } else {
      // TODO: error - we don't support the kind of literal this is
      return '';
    }
  });
  return `oneOf(${possibleValues.join(', ')})`;
}

function generateFieldsForInterface(
  targetInterface: ts.InterfaceDeclaration
): string[] {
  const fieldCodeOutput: string[] = [];
  for (const member of targetInterface.members) {
    let fieldName = '';
    let fieldValue: string | null = null;
    if (ts.isPropertySignature(member)) {
      if (ts.isIdentifier(member.name)) {
        fieldName = member.name.escapedText.toString();
      }
      if (member.type?.kind === ts.SyntaxKind.StringKeyword) {
        fieldValue = "''";
      } else if (member.type?.kind === ts.SyntaxKind.BooleanKeyword) {
        fieldValue = 'bool()';
      } else if (member.type?.kind === ts.SyntaxKind.NumberKeyword) {
        fieldValue = 'sequence()';
      } else if (member.type && ts.isUnionTypeNode(member.type)) {
        fieldValue = generateForUnion(member.type);
      } else if (member.type && ts.isArrayTypeNode(member.type)) {
        fieldValue = `perBuild(() => {
      return [];
    })`;
      }
    }
    if (fieldValue === null) {
      fieldCodeOutput.push(cannotGenerateComment(fieldName));
    } else {
      fieldCodeOutput.push(`${fieldName}: ${fieldValue},`);
    }
  }
  return fieldCodeOutput;
}

// type Indent = '\t' | '  ';
// function indent(line, amount, spaces: boolean) {

// }

function indent(str: string, indentChar: IndentType, amount: number): string {
  return indentChar.repeat(amount) + str;
}

interface GeneratorConfig {
  tabs: boolean;
}

const enum IndentType {
  TAB = '\t',
  SPACE = '  ',
}
export function generate(
  node: ts.Node,
  targetInterfaceName: string,
  config: GeneratorConfig
): GeneratorResult {
  const indentChar = config.tabs ? IndentType.TAB : IndentType.SPACE;

  const targetInterface = findTargetInterface(node, targetInterfaceName);
  if (!targetInterface) {
    // FIXME: should probably error here.
    return { code: '' };
  }
  const fields = generateFieldsForInterface(targetInterface);
  const codeParts: string[] = [];
  codeParts.push(
    `const ${targetInterfaceName.toLowerCase()}Builder = build<${targetInterfaceName}>({`
  );
  codeParts.push(indent(`fields: {`, indentChar, 1));
  for (const fieldCode of fields) {
    codeParts.push(indent(fieldCode, indentChar, 2));
  }
  codeParts.push(indent('},', indentChar, 1));
  codeParts.push(`});`);
  return { code: codeParts.join('\n') };
}
