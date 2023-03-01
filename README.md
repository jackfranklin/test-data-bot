# @jackfranklin/test-data-bot

[![npm version](https://badge.fury.io/js/%40jackfranklin%2Ftest-data-bot.svg)](https://badge.fury.io/js/%40jackfranklin%2Ftest-data-bot)

**IMPORTANT**: `@jackfranklin/test-data-bot` is the new version of this package, written in TypeScript and initially released as version 1.0.0.

The old package, `test-data-bot` (_not scoped to my username on npm_) was last released as 0.8.0 and is not being updated any more. It is recommended to upgrade to 1.0.0, which has some breaking changes documented below.

If you want to find the old documentation for `0.8.0`, you can [do so via an old README on GitHub](https://github.com/jackfranklin/test-data-bot/blob/c0fd856cbe8ea26024725aaca47e433fe727ddff/README.md).

# Motivation and usage

test-data-bot was inspired by [Factory Bot](https://github.com/thoughtbot/factory_bot), a Ruby library that makes it really easy to generate fake yet realistic looking data for your unit tests.

Rather than creating random objects each time you want to test something in your system you can instead use a _factory_ that can create fake data. This keeps your tests consistent and means that they always use data that replicates the real thing. If your tests work off objects close to the real thing they are more useful and there's a higher chance of them finding bugs.

_Rather than the term `factory`, test-data-bot uses `builder`._

test-data-bot makes no assumptions about frameworks or libraries, and can be used with any test runner too. test-data-bot is written in TypeScript, so if you use that you'll get nice type safety (see the TypeScript section of this README) but you can use it in JavaScript with no problems.

```
npm install --save-dev @jackfranklin/test-data-bot
yarn add --dev @jackfranklin/test-data-bot
```

## Creating your first builder

We use the `build` function to create a builder. You give a builder an object of fields you want to define:

```js
const { build } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: 'jack',
  },
});

const user = userBuilder.one();
console.log(user);
// => { name: 'jack'}
```

_While the examples in this README use `require`, you can also use `import {build} from '@jackfranklin/test-data-bot'`._

Once you've created a builder, you can call the `one` method it returns to generate an instance of that object - in this case, a `user`.

```
const user = userBuilder.one();
```

> You can also call the builder directly to get a single instance - `userBuilder()`. v2.1 of test-data-bot shipped with the `one()` method and that is now the recommended way of constructing these objects.

It would be boring though if each user had the same `name` - so test-data-bot lets you generate data via some API methods:

### Incrementing IDs with `sequence`

Often you will be creating objects that have an ID that comes from a database, so you need to guarantee that it's unique. You can use `sequence`, which increments every time it's called:

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    id: sequence(),
  },
});

const userOne = userBuilder.one();
const userTwo = userBuilder.one();

// userOne.id === 1
// userTwo.id === 2
```

If you need more control, you can pass `sequence` a function that will be called with the number. This is useful to ensure completely unique emails, for example:

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    email: sequence(x => `jack${x}@gmail.com`),
  },
});

const userOne = userBuilder.one();
const userTwo = userBuilder.one();

// userOne.email === jack1@gmail.com
// userTwo.email === jack2@gmail.com
```

You can use the `reset` method to reset the counter used internally when generating a sequence:

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    id: sequence(),
  },
});

const userOne = userBuilder.one();
const userTwo = userBuilder.one();
userBuilder.reset();
const userThree = userBuilder.one();
const userFour = userBuilder.one();

// userOne.id === 1
// userTwo.id === 2
// userThree.id === 1 <- the sequence has been reset here
// userFour.id === 2
```

### Randomly picking between an option with `oneOf`

If you want an object to have a random value, picked from a list you control, you can use `oneOf`:

```js
const { build, oneOf } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: oneOf('alice', 'bob', 'charlie'),
  },
});
```

### `bool`

If you need something to be either `true` or `false`, you can use `bool`:

```js
const { build, bool } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    isAdmin: bool(),
  },
});
```

### `perBuild`

test-data-bot lets you declare a field to always be a particular value:

```js
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: 'jack',
    details: {},
  },
});
```

A user generated from this builder will always be the same data. However, if you generate two users using the builder above, they will have _exactly the same object_ for the `details` key:

```js
const userOne = userBuilder.one();
const userTwo = userBuilder.one();

userOne.details === userTwo.details; // true
```

If you want to generate a unique object every time, you can use `perBuild` which takes a function and executes it when a builder is built:

```js
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: 'jack',
    details: perBuild(() => {
      return {};
    }),
  },
});

const userOne = userBuilder.one();
const userTwo = userBuilder.one();

userOne.details === userTwo.details; // false
```

This approach also lets you use any additional libraries, say if you wanted to use a library to generate fake data:

```js
const myFakeLibrary = require('whatever-library-you-want');
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: perBuild(() => myFakeLibrary.randomName()),
  },
});
```

## Overrides per-build

You'll often need to generate a random object but control one of the values directly for the purpose of testing. When you call a builder you can pass in overrides which will override the builder defaults:

```js
const { build, fake, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    id: sequence(),
    name: fake(f => f.name.findName()),
  },
});

const user = userBuilder.one({
  overrides: {
    id: 1,
    name: 'jack',
  },
});

// user.id === 1
// user.name === 'jack'
```

If you need to edit the object directly, you can pass in a `map` function when you call the builder. This will be called after test-data-bot has generated the fake object, and lets you directly change its properties.

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    id: sequence(),
    name: 'jack',
  },
});

const user = userBuilder.one({
  map: user => {
    user.name = user.name.toUpperCase();
    return user;
  },
});
```

Using `overrides` and `map` lets you easily customise a specific object that a builder has created.


### Creating multiple instances

If you want to create multiple instances of a builder at once, you can use the `many` method on the builder:

```js
const userBuilder = build({
  fields: {
    name: 'jack',
  },
});

const users = userBuilder.many(20); // Creates an array of 20 users.
```

If you want to pass in any build time configuration, you can pass in a second argument which takes the exact same configuration as calling `userBuilder()` directly:

```js
const userBuilder = build({
  fields: {
    name: 'jack',
  },
});

const users = userBuilder.many(20, {
  overrides: {
    name: 'bob'
  }
}); // Creates an array of 20 users, each called "bob"!
```

### Mapping over all the created objects with `postBuild`

If you need to transform an object in a way that test-data-bot doesn't support out the box, you can pass a `postBuild` function when creating a builder. This builder will run every time you create an object from it.

```js
const { build, fake } = require('@jackfranklin/test-data-bot');

const userBuilder = build({
  fields: {
    name: fake(f => f.name.findName()),
  },
  postBuild: user => {
    user.name = user.name.toUpperCase();
    return user;
  },
});

const user = userBuilder.one();
// user.name will be uppercase
```

## Traits (*new in v1.3*)

Traits let you define a set of overrides for a factory that can easily be re-applied. Let's imagine you've got a users factory where users can be admins:

```ts
interface User {
  name: string;
  admin: boolean;
}

const userBuilder = build<User>({
  fields: {
    name: 'jack',
    admin: false,
  },
  traits: {
    admin: {
      overrides: { admin: true },
    },
  },
});
```

Notice that we've defined the `admin` trait here. You don't need to do this; you could easily override the `admin` field each time:

```js
const adminUser = userBuilder.one({ overrides: { admin: true } });
```

But imagine that the field changes, or the way you represent admins changes. Or imagine setting an admin is not just one field but a few fields that need to change. Maybe an admin's email address always has to be a certain domain. We can define that behaviour once as a trait:

```ts
const userBuilder = build<User>({
  fields: {
    name: 'jack',
    admin: false,
  },
  traits: {
    admin: {
      overrides: { admin: true },
    },
  },
});
```

And now building an admin user is easy:

```js
const admin = userBuilder.one({ traits: 'admin' });
```

You can define and use multiple traits when building an object. Be aware that if two traits override the same value, the one passed in last wins:

```
// any properties defined in other-trait will override any that admin sets
const admin = userBuilder.one({ traits: ['admin', 'other-trait'] });
```

## TypeScript support

test-data-bot is written in TypeScript and ships with the types generated so if you're using TypeScript you will get some nice type support out the box.

The builders are generic, so you can describe to test-data-bot exactly what object you're creating:

```ts
interface User {
  id: number;
  name: string;
}

const userBuilder = build<User>('User', {
  fields: {
    id: sequence(),
    name: perBuild(() => yourCustomFakerLibary().name)
  },
});

const users = userBuilder.one();
```

You should get TypeScript errors if the builder doesn't satisfy the interface you've given it.

## What happened to Faker / the `fake` generator?

Prior to v2.0.0 of this library, we shipped built-in support for using Faker.js to generate data. It was removed because it was a big dependency to ship to all users, even those who don't use faker. If you want to use it you can, in combination with the `perBuild` builder:

```js
import {build, perBuild} from '@jackfranklin/test-data-bot';

// This can be any fake data library you like.
import fake from 'faker';

const userBuilder = build({
  // Within perBuild, call your faker library directly.
  name: perBuild(() => fake().name())
})
```
