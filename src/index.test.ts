import { build, sequence, oneOf, bool, perBuild } from './index';
import { assert } from 'chai';
import sinon from 'sinon';

describe('test-data-bot', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('can build an object with no name', () => {
    interface User {
      name: string;
    }

    const userBuilder = build<User>({
      fields: {
        name: 'jack',
      },
    });

    const user = userBuilder();
    assert.deepEqual(user, { name: 'jack' });
  });

  it('can build an object with primitive values only', () => {
    interface User {
      name: string;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: 'jack',
      },
    });

    const user = userBuilder();
    assert.deepEqual(user, { name: 'jack' });
  });

  it('lets you pass null in as a value', () => {
    interface User {
      name: string | null;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: null,
      },
    });

    const user = userBuilder();
    assert.deepEqual(user, { name: null });
  });

  it('lets you pass undefined in as a value', () => {
    interface User {
      name?: string;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: undefined,
      },
    });

    const user = userBuilder();
    assert.deepEqual(user, { name: undefined });
  });

  it('supports nulls in nested builders', () => {
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
    assert.isNull(company.mailingAddress.street2);
  });

  it('lets a value be overriden when building an instance', () => {
    interface User {
      name: string;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: perBuild(() => 'jack'),
      },
    });

    const user = userBuilder({ overrides: { name: 'customName' } });
    assert.deepEqual(user, {
      name: 'customName',
    });
  });

  it('lets a value be overridden with 0 when building an instance', () => {
    interface Product {
      amount: number;
    }

    const productBuilder = build<Product>('Product', {
      fields: {
        amount: 10,
      },
    });

    const product = productBuilder({ overrides: { amount: 0 } });
    assert.deepEqual(product, {
      amount: 0,
    });
  });

  it('lets a value be overridden with null when building an instance', () => {
    interface User {
      name: string | null;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: 'name',
      },
    });

    const user = userBuilder({ overrides: { name: null } });
    assert.deepEqual(user, {
      name: null,
    });
  });

  describe('perBuild', () => {
    it('generates a new object each time', () => {
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

      assert.deepEqual(user1.data, {});
      assert.deepEqual(user2.data, {});
      assert.notStrictEqual(user1.data, user2.data);
    });
  });

  describe('sequence', () => {
    it('increments the sequence value per build', () => {
      interface User {
        id: number;
      }

      const userBuilder = build<User>('User', {
        fields: {
          id: sequence(),
        },
      });

      const users = [userBuilder(), userBuilder()];
      assert.deepEqual(users, [{ id: 1 }, { id: 2 }]);
    });

    it('can take a function that returns a string', () => {
      interface User {
        id: string;
      }

      const userBuilder = build<User>('User', {
        fields: {
          id: sequence((x) => `jack${x}@gmail.com`),
        },
      });

      const user = userBuilder();
      assert.deepEqual(user, { id: 'jack1@gmail.com' });
    });

    it('can take a function to return a number', () => {
      interface User {
        id: number;
      }

      const userBuilder = build<User>('User', {
        fields: {
          id: sequence((x) => x * 10),
        },
      });

      const users = [userBuilder(), userBuilder()];
      assert.deepEqual(users, [{ id: 10 }, { id: 20 }]);
    });
    it('can have the sequence be manually reset', () => {
      interface User {
        id: number;
      }

      const userBuilder = build<User>('User', {
        fields: {
          id: sequence((x) => x ** 2),
        },
      });

      const usersGroup1 = [userBuilder(), userBuilder(), userBuilder()];
      assert.deepEqual(usersGroup1, [{ id: 1 }, { id: 4 }, { id: 9 }]);

      userBuilder.reset();

      const usersGroup2 = [userBuilder(), userBuilder(), userBuilder()];
      assert.deepEqual(usersGroup2, [{ id: 1 }, { id: 4 }, { id: 9 }]);
    });

    it('can have a simple sequence be manually reset', () => {
      interface User {
        id: number;
      }

      const userBuilder = build<User>('User', {
        fields: {
          id: sequence(),
        },
      });

      const usersGroup1 = [userBuilder(), userBuilder(), userBuilder()];
      assert.deepEqual(usersGroup1, [{ id: 1 }, { id: 2 }, { id: 3 }]);

      userBuilder.reset();

      const usersGroup2 = [userBuilder(), userBuilder(), userBuilder()];
      assert.deepEqual(usersGroup2, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });

  describe('mapping', () => {
    it('lets you map over the generated object to fully customise it', () => {
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
      assert.strictEqual(user.name, 'customName');
      assert.deepEqual(user.sports, {
        football: true,
        rugby: true,
      });
    });

    it('lets you define the map on the builder level as postBuild', () => {
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
      assert.strictEqual(user.name, 'JACK');
    });

    it('runs the postBuild function after applying overrides', () => {
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
      assert.strictEqual(user.name, 'JACK');
    });

    it('the build time map function runs after postBuild', () => {
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
          assert.strictEqual(user.name, 'JACK');
          user.name = 'new name';
          return user;
        },
      });
      assert.strictEqual(user.name, 'new name');
    });
  });

  describe('oneOf', () => {
    it('bool is provided as a shortcut for oneOf(true, false)', () => {
      interface User {
        admin: boolean;
      }

      const userBuilder = build<User>('User', {
        fields: {
          admin: bool(),
        },
      });

      const user = userBuilder();
      assert.typeOf(user.admin, 'boolean');
    });

    it('picks a random entry from the given selection', () => {
      interface User {
        name: string;
      }

      const userBuilder = build<User>('User', {
        fields: {
          name: oneOf('a', 'b', 'c'),
        },
      });

      const user = userBuilder();
      assert.includeMembers(['a', 'b', 'c'], [user.name]);
    });
  });

  describe('nested objects', () => {
    it('fully expands arrays', () => {
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
      assert.deepEqual(user.friends.names, ['test1', 'test2']);
    });

    it('fully expands super nested awkward things', () => {
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
      assert.strictEqual(user.name, 'jack');
      assert.deepEqual(user.friends, [
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
    });

    it('fully expands objects to ensure all builders are executed', () => {
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

      assert.typeOf(user.details.name, 'string');
      assert.typeOf(user.admin, 'boolean');
    });

    it('does not call postBuild on nested objects', () => {
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

      assert.deepEqual(user, {
        name: 'new name',
        sports: {
          football: true,
          basketball: false,
          rugby: true,
        },
      });
    });
  });

  describe('traits', () => {
    it('allows a trait to be defined and then used', () => {
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
      assert.strictEqual(userNoTrait.admin, false);
      assert.strictEqual(userWithTrait.admin, true);
    });

    it('allows a trait to define a postBuild function', () => {
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
      assert.strictEqual(userNoTrait.name, 'jack');
      assert.strictEqual(userWithTrait.name, 'postBuildTrait');
    });

    it('applies build time overrides over traits', () => {
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
      assert.isFalse(userWithTrait.admin);
    });

    it('supports multiple traits', () => {
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
      assert.deepEqual(userWithTrait, {
        name: 'bob',
        admin: true,
      });
    });

    it('traits passed later override earlier ones', () => {
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
      assert.deepEqual(userWithTrait, {
        name: 'bob',
      });
    });

    it('logs a warning if you pass a trait that was not defined', () => {
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

      assert.deepEqual(userWithTrait, { name: 'jack' });
      assert.isTrue(
        consoleStub.calledOnceWithExactly(
          "Warning: trait 'not-passed' not found."
        )
      );
    });
  });
});
