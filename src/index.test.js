const { build, fakeData, sequenceData } = require('./index')

describe('building a generator', () => {
  it('generates an object that can build items', () => {
    const userBuilder = build('User').fields({
      name: fakeData(f => f.name.findName()),
      email: sequenceData(x => `jack${x}@test.com`),
      age: 26,
    })

    const user = userBuilder()
    expect(user).toEqual({
      name: expect.any(String),
      email: 'jack1@test.com',
      age: 26,
    })
  })
})
