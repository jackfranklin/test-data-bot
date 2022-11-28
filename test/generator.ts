import tap from 'tap';
import ts from 'typescript';
import { generate } from '../src/generator';

const randomStr = () => Math.random().toString(36).substring(7);

export const createTypeScriptSourceFile = (code: string) => {
  const fileName = `${randomStr()}.ts`;
  return ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext);
};

tap.test('generates empty strings for string types', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      name: string;
    }
`);

  /*
    build<User>({
     fields: {
      name: ''
     }
    })
  */
  const result = generate(file, 'User');
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    name: '',
  },
});`,
    result.code
  );
  t.end();
});

tap.test('generates sequence() fields for number types)', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      name: string;
      id: number;
    }
`);

  const result = generate(file, 'User');
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    name: '',
    id: sequence(),
  },
});`,
    result.code
  );
  t.end();
});

tap.test('generates oneOf() for union types', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      colour: 'RED'|'BLUE'|5;
    }
`);

  const result = generate(file, 'User');
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    colour: oneOf('RED', 'BLUE', 5),
  },
});`,
    result.code
  );
  t.end();
});
