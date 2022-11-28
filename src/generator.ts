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

function generateFieldsForInterface(
  targetInterface: ts.InterfaceDeclaration
): string[] {
  const fieldCodeOutput: string[] = [];
  for (const member of targetInterface.members) {
    let fieldName = '';
    let fieldValue = '';
    if (ts.isPropertySignature(member)) {
      if (ts.isIdentifier(member.name)) {
        fieldName = member.name.escapedText.toString();
      }
      if (member.type?.kind === ts.SyntaxKind.StringKeyword) {
        fieldValue = "''";
      }
    }
    fieldCodeOutput.push(`${fieldName}: ${fieldValue}`);
    // ts.SyntaxKind;
  }
  return fieldCodeOutput;
}

export function generate(
  node: ts.Node,
  targetInterfaceName: string
): GeneratorResult {
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
  codeParts.push(`  fields: {`);
  for (const fieldCode of fields) {
    codeParts.push(`    ${fieldCode},`);
  }
  codeParts.push(`  },`);
  codeParts.push(`});`);
  return { code: codeParts.join('\n') };
}
