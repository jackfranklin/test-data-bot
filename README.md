# test-data-bot

An easy way to generate test data for your JavaScript unit tests. Completely agnostic of test runner, framework or environment.

```
npm install --save-dev test-data-bot
```

```js
const { build, fake, sequence } = require('test-data-bot')

const userBuilder = build('User').fields({
  name: fake(f => f.name.findName()),
  email: sequence(x => `jack${x}@test.com`),
  age: 26,
})

const user = userBuilder()
console.log(user)
// => { name: 'Bob Fleming', email: 'jack1@test.com', age: 26 }
```

# API

Firstly, use `build` to create a new builder. The name passed is just for debugging/documentation purposes and can be whatever you'd like.

Once you've created a builder, use `fields` to pass in the names and values of fields.

Field values can be one of:

- A static value, in which case any generated data from this builder will always use that value.
- A call to `sequence`, which takes a function which is passed a number. This is an easy way to ensure a value is unique everytime, but still know what it will be. A sequence is per field, and the number starts at 1.
- A call to `fake`. This takes a function that will be called with an instance of [faker.js](https://github.com/marak/Faker.js/), and you can use any of the [faker API methods](https://github.com/marak/Faker.js/#api-methods) to return data.

## Mapping

The test-data-bot always creates plain JavaScript objects, but you may need to generate instances of a class, for example. In this instance, you can pass a `map` to the builder. This will be called with the generated object, and you can then do with that data whatever you'd like:

```js
const userBuilder = build('User')
  .fields({
    name: fake(f => f.name.findName()),
    email: sequence(x => `jack${x}@test.com`),
  })
  .map(user => ({
    name: user.name.toUpperCase(),
    email: user.email.toUpperCase(),
  }))

const user = userBuilder()

console.log(user)
// => { name: 'BOB FLEMING', email: 'JACK1@TEST.COM' }
```
