import { build, sequence, oneOf, bool, perBuild } from '../src/index';
import sinon from 'sinon';
import tap from 'tap';

tap.afterEach(() => sinon.restore()); //eslint-disable-line tap/test-ended

tap.test('can build a basic object from a factory', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
    },
  });

  const user = userBuilder();
  t.same(user, { name: 'jack' });
  t.same(user, { name: 'jack' });
  t.end();
});

tap.test('can build an object with primitive values only', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    fields: {
      name: 'jack',
    },
  });

  const user = userBuilder();
  t.same(user, { name: 'jack' });
  t.end();
});

tap.test('lets you pass null in as a value', (t) => {
  interface User {
    name: string | null;
  }

  const userBuilder = build<User>('User', {
    fields: {
      name: null,
    },
  });

  const user = userBuilder();
  t.same(user, { name: null });
  t.end();
});

tap.test('lets you pass undefined in as a value', (t) => {
  interface User {
    name?: string;
  }

  const userBuilder = build<User>('User', {
    fields: {
      name: undefined,
    },
  });

  const user = userBuilder();
  t.same(user, { name: undefined });
  t.end();
});

tap.test('supports nulls in nested builders', (t) => {
  interface Address {
    street1: string;
    street2: string | null;
    city: string;
    state: string;
    zipCode: string;
  }
  interface Company {
    id: string;
    name: string;
    mailingAddress: Address;
  }

  const addressBuilder = build<Address>('Address', {
    fields: {
      street1: perBuild(() => 'some street'),
      street2: null,
      city: 'city',
      state: 'state',
      zipCode: 'zip',
    },
  });

  const companyBuilder = build<Company>('Company', {
    fields: {
      id: '123',
      name: 'Test',
      mailingAddress: perBuild(addressBuilder),
    },
  });

  const company = companyBuilder();
  tap.equal(company.mailingAddress.street2, null);
  t.end();
});

tap.test('lets a value be overriden when building an instance', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    fields: {
      name: perBuild(() => 'jack'),
    },
  });

  const user = userBuilder({ overrides: { name: 'customName' } });
  t.same(user, {
    name: 'customName',
  });
  t.end();
});

tap.test('lets a value be overridden with 0 when building an instance', (t) => {
  interface Product {
    amount: number;
  }

  const productBuilder = build<Product>('Product', {
    fields: {
      amount: 10,
    },
  });

  const product = productBuilder({ overrides: { amount: 0 } });
  t.same(product, {
    amount: 0,
  });
  t.end();
});

tap.test(
  'lets a value be overridden with null when building an instance',
  (t) => {
    interface User {
      name: string | null;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: 'name',
      },
    });

    const user = userBuilder({ overrides: { name: null } });
    t.same(user, {
      name: null,
    });
    t.end();
  }
);

tap.test('perBuild generates a new object each time', (t) => {
  interface User {
    data: Record<string, unknown>;
  }

  const userBuilder = build<User>('User', {
    fields: {
      data: perBuild(() => ({})),
    },
  });

  const user1 = userBuilder();
  const user2 = userBuilder();

  t.same(user1.data, {});
  t.same(user2.data, {});
  t.not(user1.data, user2.data);
  t.end();
});
tap.test('sequence gets incremented per build', (t) => {
  interface User {
    id: number;
  }

  const userBuilder = build<User>('User', {
    fields: {
      id: sequence(),
    },
  });

  const users = [userBuilder(), userBuilder()];
  t.same(users, [{ id: 1 }, { id: 2 }]);
  t.end();
});

tap.test('sequence can take a function that returns a string', (t) => {
  interface User {
    id: string;
  }

  const userBuilder = build<User>('User', {
    fields: {
      id: sequence((x) => `jack${x}@gmail.com`),
    },
  });

  const user = userBuilder();
  t.same(user, { id: 'jack1@gmail.com' });
  t.end();
});

tap.test('can take a function to return a number', (t) => {
  interface User {
    id: number;
  }

  const userBuilder = build<User>('User', {
    fields: {
      id: sequence((x) => x * 10),
    },
  });

  const users = [userBuilder(), userBuilder()];
  t.same(users, [{ id: 10 }, { id: 20 }]);
  t.end();
});
tap.test('can have the sequence be manually reset', (t) => {
  interface User {
    id: number;
  }

  const userBuilder = build<User>('User', {
    fields: {
      id: sequence((x) => x ** 2),
    },
  });

  const usersGroup1 = [userBuilder(), userBuilder(), userBuilder()];
  t.same(usersGroup1, [{ id: 1 }, { id: 4 }, { id: 9 }]);

  userBuilder.reset();

  const usersGroup2 = [userBuilder(), userBuilder(), userBuilder()];
  t.same(usersGroup2, [{ id: 1 }, { id: 4 }, { id: 9 }]);
  t.end();
});

tap.test('can have a simple sequence be manually reset', (t) => {
  interface User {
    id: number;
  }

  const userBuilder = build<User>('User', {
    fields: {
      id: sequence(),
    },
  });

  const usersGroup1 = [userBuilder(), userBuilder(), userBuilder()];
  t.same(usersGroup1, [{ id: 1 }, { id: 2 }, { id: 3 }]);

  userBuilder.reset();

  const usersGroup2 = [userBuilder(), userBuilder(), userBuilder()];
  t.same(usersGroup2, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  t.end();
});

tap.test(
  'lets you map over the generated object to fully customise it',
  (t) => {
    interface User {
      name: string;
      sports: {
        football: boolean;
        rugby: boolean;
      };
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: perBuild(() => 'jack'),
        sports: {
          football: true,
          rugby: false,
        },
      },
    });

    const user = userBuilder({
      overrides: {
        name: 'customName',
      },
      map: (user) => {
        user.sports.rugby = true;
        return user;
      },
    });

    t.equal(user.name, 'customName');
    t.same(user.sports, {
      football: true,
      rugby: true,
    });
    t.end();
  }
);

tap.test('lets you define the map on the builder level as postBuild', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    postBuild: (user) => {
      user.name = user.name.toUpperCase();
      return user;
    },
    fields: {
      name: perBuild(() => 'jack'),
    },
  });

  const user = userBuilder();
  t.equal(user.name, 'JACK');
  t.end();
});

tap.test('runs the postBuild function after applying overrides', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    postBuild: (user) => {
      user.name = user.name.toUpperCase();
      return user;
    },
    fields: {
      name: perBuild(() => 'test'),
    },
  });

  const user = userBuilder({
    overrides: {
      name: 'jack',
    },
  });
  t.equal(user.name, 'JACK');
  t.end();
});

tap.test('the build time map function runs after postBuild', (t) => {
  t.plan(2);
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    postBuild: (user) => {
      user.name = user.name.toUpperCase();
      return user;
    },
    fields: {
      name: 'test',
    },
  });

  const user = userBuilder({
    overrides: {
      name: 'jack',
    },
    map: (user) => {
      t.equal(user.name, 'JACK');
      user.name = 'new name';
      return user;
    },
  });
  t.equal(user.name, 'new name');
  t.end();
});

tap.test('bool is provided as a shortcut for oneOf(true, false)', (t) => {
  interface User {
    admin: boolean;
  }

  const userBuilder = build<User>('User', {
    fields: {
      admin: bool(),
    },
  });

  const user = userBuilder();
  t.type(user.admin, 'boolean');
  t.end();
});

tap.test('picks a random entry from the given selection', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>('User', {
    fields: {
      name: oneOf('a', 'b', 'c'),
    },
  });

  const user = userBuilder();
  t.ok(['a', 'b', 'c'].includes(user.name));
  t.end();
});

tap.test('nested arrays get fully expanded', (t) => {
  interface User {
    friends: {
      names: string[];
    };
  }

  const userBuilder = build<User>('User', {
    fields: {
      friends: {
        names: [perBuild(() => 'test1'), 'test2'],
      },
    },
  });

  const user = userBuilder();
  t.same(user.friends.names, ['test1', 'test2']);
  t.end();
});

tap.test('fully expands super nested awkward things', (t) => {
  interface Friend {
    name: string;
    sports: {
      [x: string]: boolean;
    };
  }

  interface User {
    name: string;
    friends: Friend[];
  }

  const friendBuilder = build<Friend>('Friend', {
    fields: {
      name: perBuild(() => 'some name'),
      sports: {
        football: bool(),
        basketball: false,
        rugby: true,
      },
    },
  });

  const userBuilder = build<User>('User', {
    fields: {
      name: 'jack',
      friends: [
        friendBuilder({ overrides: { name: 'customName' } }),
        friendBuilder({
          overrides: {
            sports: {
              rugby: false,
            },
          },
        }),
      ],
    },
  });

  const user = userBuilder();
  t.equal(user.name, 'jack');
  t.same(user.friends, [
    {
      name: 'customName',
      sports: {
        football: user.friends[0].sports.football,
        basketball: false,
        rugby: true,
      },
    },
    {
      name: user.friends[1].name,
      sports: {
        rugby: false,
      },
    },
  ]);
  t.end();
});

tap.test('fully expands objects to ensure all builders are executed', (t) => {
  interface User {
    details: {
      name: string;
    };
    admin: boolean;
  }

  const userBuilder = build<User>('User', {
    fields: {
      details: {
        name: perBuild(() => 'test name'),
      },
      admin: bool(),
    },
  });

  const user = userBuilder();

  t.type(user.details.name, 'string');
  t.type(user.admin, 'boolean');
  t.end();
});

tap.test('does not call postBuild on nested objects', (t) => {
  interface User {
    name: string;
    sports: {
      football: boolean;
      basketball: boolean;
      rugby: boolean;
    };
  }

  const userBuilder = build<User>('User', {
    postBuild: (user) => ({
      ...user,
      name: 'new name',
    }),
    fields: {
      name: 'old name',
      sports: {
        football: true,
        basketball: false,
        rugby: true,
      },
    },
  });

  const user = userBuilder();

  t.same(user, {
    name: 'new name',
    sports: {
      football: true,
      basketball: false,
      rugby: true,
    },
  });
  t.end();
});

tap.test('allows a trait to be defined and then used', (t) => {
  interface User {
    name: string;
    admin: boolean;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
      admin: perBuild(() => false),
    },
    traits: {
      admin: {
        overrides: { admin: perBuild(() => true) },
      },
    },
  });

  const userNoTrait = userBuilder();
  const userWithTrait = userBuilder({ traits: 'admin' });
  t.equal(userNoTrait.admin, false);
  t.equal(userWithTrait.admin, true);
  t.end();
});

tap.test('allows a trait to define a postBuild function', (t) => {
  interface User {
    name: string;
    admin: boolean;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
      admin: perBuild(() => false),
    },
    traits: {
      admin: {
        overrides: { admin: perBuild(() => true) },
        postBuild: (user) => {
          user.name = 'postBuildTrait';
          return user;
        },
      },
    },
  });

  const userNoTrait = userBuilder();
  const userWithTrait = userBuilder({ traits: 'admin' });
  t.equal(userNoTrait.name, 'jack');
  t.equal(userWithTrait.name, 'postBuildTrait');
  t.end();
});

tap.test('applies build time overrides over traits', (t) => {
  interface User {
    name: string;
    admin: boolean;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
      admin: perBuild(() => false),
    },
    traits: {
      admin: {
        overrides: { admin: perBuild(() => true) },
      },
    },
  });

  const userWithTrait = userBuilder({
    traits: 'admin',
    overrides: {
      admin: perBuild(() => false),
    },
  });
  t.notOk(userWithTrait.admin);
  t.end();
});

tap.test('supports multiple traits', (t) => {
  interface User {
    name: string;
    admin: boolean;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
      admin: perBuild(() => false),
    },
    traits: {
      admin: {
        overrides: { admin: perBuild(() => true) },
      },
      bob: {
        overrides: { name: 'bob' },
      },
    },
  });

  const userWithTrait = userBuilder({
    traits: ['admin', 'bob'],
  });
  t.same(userWithTrait, {
    name: 'bob',
    admin: true,
  });
  t.end();
});

tap.test('traits passed later override earlier ones', (t) => {
  interface User {
    name: string;
  }

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
    },
    traits: {
      alice: {
        overrides: { name: 'alice' },
      },
      bob: {
        overrides: { name: 'bob' },
      },
    },
  });

  const userWithTrait = userBuilder({
    traits: ['alice', 'bob'],
  });
  t.same(userWithTrait, {
    name: 'bob',
  });
  t.end();
});

tap.test('logs a warning if you pass a trait that was not defined', (t) => {
  interface User {
    name: string;
  }

  const consoleStub = sinon.stub(console, 'warn').callsFake(() => {});

  const userBuilder = build<User>({
    fields: {
      name: 'jack',
    },
  });
  const userWithTrait = userBuilder({
    traits: 'not-passed',
  });

  t.same(userWithTrait, { name: 'jack' });
  t.ok(
    consoleStub.calledOnceWithExactly("Warning: trait 'not-passed' not found.")
  );
  t.end();
});

tap.test('dates can be created and overwritten correctly', (t) => {
  interface Plan {
    createdAt: Date;
  }

  const planBuilder = build<Plan>('Plan', {
    fields: {
      createdAt: perBuild(() => new Date()),
    },
  });

  const plan = planBuilder();
  t.type(plan.createdAt, 'Date');

  const planWithCustomDate = planBuilder({
    overrides: {
      createdAt: new Date(),
    },
  });
  t.type(planWithCustomDate.createdAt, 'Date');

  t.end();
});
