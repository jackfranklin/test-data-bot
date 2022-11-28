import tap from 'tap';
import ts from 'typescript';
import { generate } from '../src/generator';

const randomStr = () => Math.random().toString(36).substring(7);

export const createTypeScriptSourceFile = (code: string) => {
  const fileName = `${randomStr()}.ts`;
  return ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext);
};

tap.test('generators', (t) => {
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
