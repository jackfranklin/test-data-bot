import { build, sequence, fake } from './index';

describe('test-data-bot', () => {
  it('can build an object with primitive values only', () => {
    const userBuilder = build('User', {
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
      const userBuilder = build('User', {
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
      const userBuilder = build('User', {
        fields: {
          name: fake(f => f.name.findName()),
        },
      });

      const user = userBuilder();
      expect(user.name).toEqual(expect.any(String));
    });
  });
});
