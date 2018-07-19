const { build, fake, sequence, incrementingId, perBuild } = require('./index')

describe('generating fake items', () => {
  it('generates an object that can build items', () => {
    const userBuilder = build('User').fields({
      name: fake(f => f.name.findName()),
      email: sequence(x => `jack${x}@test.com`),
      age: 26,
    })

    const user = userBuilder()
    expect(user).toEqual({
      name: expect.any(String),
      email: 'jack1@test.com',
      age: 26,
    })
  })

  it('increases sequence numbers', () => {
    const userBuilder = build('User').fields({
      email: sequence(x => `jack${x}@test.com`),
    })

    const users = [userBuilder(), userBuilder(), userBuilder()]
    expect(users.map(u => u.email)).toEqual([
      'jack1@test.com',
      'jack2@test.com',
      'jack3@test.com',
    ])
  })

  it('allows a specific value to override', () => {
    const userBuilder = build('User').fields({
      name: fake(f => f.name.findName()),
      email: sequence(x => `jack${x}@test.com`),
    })

    const user = userBuilder({ email: 'foo' })

    expect(user).toEqual({
      name: expect.any(String),
      email: 'foo',
    })
  })

  it('allows a map function to translate the built object', () => {
    const mapFn = jest.fn().mockImplementation(x => 'DUMMY_USER_MAP')

    const userBuilder = build('User')
      .fields({
        name: fake(f => 'Jack'),
        email: sequence(x => `jack${x}@test.com`),
      })
      .map(mapFn)

    const user = userBuilder()

    expect(user).toEqual('DUMMY_USER_MAP')
    expect(mapFn).toHaveBeenCalledWith({
      name: 'Jack',
      email: 'jack1@test.com',
    })
  })

  it('supports an incrementing ID field', () => {
    const userBuilder = build('User').fields({
      id: incrementingId(),
    })

    const user1 = userBuilder()
    const user2 = userBuilder()

    expect(user1.id).toEqual(1)
    expect(user2.id).toEqual(2)
  })

  it('allows static values that are generated at runtime', () => {
    const userBuilder = build('User').fields({
      name: fake(f => 'Jack'),
      email: sequence(x => `jack${x}@test.com`),
      someObject: perBuild(() => ({})),
    })

    const user1 = userBuilder()
    const user2 = userBuilder()

    expect(user1.someObject).not.toBe(user2.someObject)
  })
})
