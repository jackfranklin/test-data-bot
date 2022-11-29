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
  const result = generate(file, 'User', { tabs: false });
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

  const result = generate(file, 'User', { tabs: false });
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

tap.test('generates oneOf() for union types with primitive types', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      colour: 'RED'|'BLUE'|5|true;
    }
`);

  const result = generate(file, 'User', { tabs: false });
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    colour: oneOf('RED', 'BLUE', 5, true),
  },
});`,
    result.code
  );
  t.end();
});

tap.test('generates bool() for boolean types', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      isAdmin: boolean;
    }
`);

  const result = generate(file, 'User', { tabs: false });
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    isAdmin: bool(),
  },
});`,
    result.code
  );
  t.end();
});

tap.test('refuses to generate oneOf calls for complex union types', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      isAdmin: 'foo'|{};
    }
`);

  const result = generate(file, 'User', { tabs: false });
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    // isAdmin: can not generate field
  },
});`,
    result.code
  );
  t.end();
});

tap.test(
  "generates a comment if it doesn't know how to generate the field value",
  (t) => {
    const file = createTypeScriptSourceFile(`
    interface User {
      isAdmin: {};
    }
`);

    const result = generate(file, 'User', { tabs: false });
    t.equal(
      `const userBuilder = build<User>({
  fields: {
    // isAdmin: can not generate field
  },
});`,
      result.code
    );
    t.end();
  }
);

tap.test('wraps object-like fields in a perBuild() call', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      isAdmin: string[]
    }
`);

  const result = generate(file, 'User', { tabs: false });
  t.equal(
    `const userBuilder = build<User>({
  fields: {
    isAdmin: perBuild(() => {
      return [];
    }),
  },
});`,
    result.code
  );
  t.end();
});

tap.skip('it can output code using tabs', (t) => {
  const file = createTypeScriptSourceFile(`
    interface User {
      isAdmin: string[]
    }
`);

  const result = generate(file, 'User', { tabs: true });
  t.equal(
    `const userBuilder = build<User>({
\tfields: {
\t\tisAdmin: perBuild(() => {
\t\t\treturn [];
\t\t}),
\t},
});`,
    result.code
  );
  t.end();
});
