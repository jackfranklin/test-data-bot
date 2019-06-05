import { build, sequence, fake } from './index';

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
});
