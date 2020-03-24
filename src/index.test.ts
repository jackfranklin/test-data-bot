import { build, sequence, fake, oneOf, bool, perBuild } from './index';

describe('test-data-bot', () => {
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
    expect(user).toEqual({
      name: 'jack',
    });
  });

  it('lets a value be overriden when building an instance', () => {
    interface User {
      name: string;
    }

    const userBuilder = build<User>('User', {
      fields: {
        name: fake((f) => f.name.findName()),
      },
    });

    const user = userBuilder({ overrides: { name: 'customName' } });
    expect(user).toEqual({
      name: 'customName',
    });
  });

  describe('perBuild', () => {
    it('generates a new object each time', () => {
      interface User {
        data: {};
      }

      const userBuilder = build<User>('User', {
        fields: {
          data: perBuild(() => ({})),
        },
      });

      const user1 = userBuilder();
      const user2 = userBuilder();

      expect(user1.data).toEqual({});
      expect(user2.data).toEqual({});
      expect(user1.data).not.toBe(user2.data);
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
      expect(users).toEqual([{ id: 1 }, { id: 2 }]);
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
      expect(users).toEqual([{ id: 10 }, { id: 20 }]);
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
          name: fake((f) => f.name.findName()),
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
      expect(user.name).toEqual('customName');
      expect(user.sports).toEqual({
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
      expect(user.name).toEqual('JACK');
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
          name: fake((f) => f.name.findName()),
        },
      });

      const user = userBuilder({
        overrides: {
          name: 'jack',
        },
      });
      expect(user.name).toEqual('JACK');
    });

    it('the build time map function runs after postBuild', () => {
      expect.assertions(2);
      interface User {
        name: string;
      }

      const userBuilder = build<User>('User', {
        postBuild: (user) => {
          user.name = user.name.toUpperCase();
          return user;
        },
        fields: {
          name: fake((f) => f.name.findName()),
        },
      });

      const user = userBuilder({
        overrides: {
          name: 'jack',
        },
        map: (user) => {
          expect(user.name).toEqual('JACK');
          user.name = 'new name';
          return user;
        },
      });
      expect(user.name).toEqual('new name');
    });
  });

  describe('fake', () => {
    it('generates some fake data', () => {
      interface User {
        name: string;
      }

      const userBuilder = build<User>('User', {
        fields: {
          name: fake((f) => f.name.findName()),
        },
      });

      const user = userBuilder();
      expect(user.name).toEqual(expect.any(String));
    });
  });

  describe('oneOf', () => {
    test('bool is provided as a shortcut for oneOf(true, false)', () => {
      interface User {
        admin: boolean;
      }

      const userBuilder = build<User>('User', {
        fields: {
          admin: bool(),
        },
      });

      const user = userBuilder();
      expect(user.admin === true || user.admin === false).toEqual(true);
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
      expect(['a', 'b', 'c'].includes(user.name)).toEqual(true);
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
            names: [
              fake((f) => f.name.findName()),
              fake((f) => f.name.findName()),
            ],
          },
        },
      });

      const user = userBuilder();
      expect(user.friends.names).toEqual([
        expect.any(String),
        expect.any(String),
      ]);
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
        friends: {
          names: Friend[];
        };
      }

      const friendBuilder = build<Friend>('Friend', {
        fields: {
          name: fake((f) => f.name.findName()),
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
      expect(user.name).toEqual('jack');
      expect(user.friends).toEqual([
        {
          name: 'customName',
          sports: {
            football: expect.any(Boolean),
            basketball: false,
            rugby: true,
          },
        },
        {
          name: expect.any(String),
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
            name: fake((f) => f.name.findName()),
          },
          admin: bool(),
        },
      });

      const user = userBuilder();
      expect(user).toEqual({
        details: {
          name: expect.any(String),
        },
        admin: expect.any(Boolean),
      });
    });
  });
});
