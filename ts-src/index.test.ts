import { build, sequence, fake, oneOf, bool } from './index';

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
  });

  describe('fake', () => {
    it('generates some fake data', () => {
      interface User {
        name: string;
      }

      const userBuilder = build<User>('User', {
        fields: {
          name: fake(f => f.name.findName()),
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
            name: fake(f => f.name.findName()),
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
