# @jackfranklin/test-data-bot

[![CircleCI](https://circleci.com/gh/jackfranklin/test-data-bot.svg?style=svg)](https://circleci.com/gh/jackfranklin/test-data-bot)

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

const userBuilder = build('User', {
  fields: {
    name: 'jack',
  },
});

const user = userBuilder();
console.log(user);
// => { name: 'jack'}
```

_While the examples in this README use `require`, you can also use `import {build} from '@jackfranklin/test-data-bot'`._

**Note**: if you're using *Version 1.2 or higher* you can leave the name of the factory and pass in only the configuration object:

```js
const userBuilder = build({
  fields: {
    name: 'jack',
  },
});
```

Feel free to use the name property if you like, but it's not used for anything in test-data-bot. It will probably get removed in a future major version.

Once you've created a builder, you can call it to generate an instance of that object - in this case, a `user`.

It would be boring though if each user had the same `name` - so test-data-bot lets you generate data via some API methods:

### Incrementing IDs with `sequence`

Often you will be creating objects that have an ID that comes from a database, so you need to guarantee that it's unique. You can use `sequence`, which increments every time it's called:

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    id: sequence(),
  },
});

const userOne = userBuilder();
const userTwo = userBuilder();

// userOne.id === 1
// userTwo.id === 2
```

If you need more control, you can pass `sequence` a function that will be called with the number. This is useful to ensure completely unique emails, for example:

```js
const { build, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    email: sequence(x => `jack${x}@gmail.com`),
  },
});

const userOne = userBuilder();
const userTwo = userBuilder();

// userOne.email === jack1@gmail.com
// userTwo.email === jack2@gmail.com
```

### Randomly picking between an option

If you want an object to have a random value, picked from a list you control, you can use `oneOf`:

```js
const { build, oneOf } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    name: oneOf('alice', 'bob', 'charlie'),
  },
});
```

### `bool`

If you need something to be either `true` or `false`, you can use `bool`:

```js
const { build, bool } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    isAdmin: bool(),
  },
});
```

### `perBuild`

test-data-bot lets you declare a field to always be a particular value:

```js
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    name: 'jack',
    details: {},
  },
});
```

A user generated from this builder will always be the same data. However, if you generate two users using the builder above, they will have _exactly the same object_ for the `details` key:

```js
const userOne = userBuilder();
const userTwo = userBuilder();

userOne.details === userTwo.details; // true
```

If you want to generate a unique object every time, you can use `perBuild` which takes a function and executes it when a builder is built:

```js
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    name: 'jack',
    details: perBuild(() => {
      return {};
    }),
  },
});

const userOne = userBuilder();
const userTwo = userBuilder();

userOne.details === userTwo.details; // false
```

This approach also lets you use any additional libraries, say if you wanted to use a library to generate fake data:

```js
const myFakeLibrary = require('whatever-library-you-want');
const { build, perBuild } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    name: perBuild(() => myFakeLibrary.randomName()),
  },
});
```

### Mapping over all the created objects with `postBuild`

If you need to transform an object in a way that test-data-bot doesn't support out the box, you can pass a `postBuild` function when creating a builder. This builder will run everytime you create an object from it.

```js
const { build, fake } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    name: fake(f => f.name.findName()),
  },
  postBuild: user => {
    user.name = user.name.toUpperCase();
    return user;
  },
});

const user = userBuilder();
// user.name will be uppercase
```

## Overrides per-build

You'll often need to generate a random object but control one of the values directly for the purpose of testing. When you call a builder you can pass in overrides which will override the builder defaults:

```js
const { build, fake, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    id: sequence(),
    name: fake(f => f.name.findName()),
  },
});

const user = userBuilder({
  overrides: {
    id: 1,
    name: 'jack',
  },
});

// user.id === 1
// user.name === 'jack'
```

If you need to edit the object directly, you can pass in a `map` function when you call the builder:

```js
const { build, fake, sequence } = require('@jackfranklin/test-data-bot');

const userBuilder = build('User', {
  fields: {
    id: sequence(),
    name: fake(f => f.name.findName()),
  },
});

const user = userBuilder({
  map: user => {
    user.name = user.name.toUpperCase();
    return user;
  },
});
```

Using `overrides` and `map` lets you easily customise a specific object that a builder has created.

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
    admin: perBuild(() => false),
  },
  traits: {
    admin: {
      overrides: { admin: perBuild(() => true) },
    },
  },
});
```

Notice that we've defined the `admin` trait here. You don't need to do this; you could easily override the `admin` field each time:

```js
const adminUser = userBuilder({ overrides: { admin: perBuild(() => true) } });
```

But imagine that the field changes, or the way you represent admins changes. Or imagine setting an admin is not just one field but a few fields that need to change. Maybe an admin's email address always has to be a certain domain. We can define that behaviour once as a trait:

```ts
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
```

And now building an admin user is easy:

```js
const admin = userBuilder({ traits: 'admin' });
```

You can define and use multiple traits when building an object. Be aware that if two traits override the same value, the one passed in last wins:

```
// any properties defined in other-trait will override any that admin sets
const admin = userBuilder({ traits: ['admin', 'other-trait'] });
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
    name: fake(f => f.name.findName()),
  },
});

const users = userBuilder();
```

You should get TypeScript errors if the builder doesn't satisfy the interface you've given it.

_I'm still quite new to TypeScript so please let me know if you don't get the errors/type hints that you expect!_

# Migrating from `test-data-bot@0.8.0` to `@jackfranklin/test-data-bot@1.0.0`

Firstly: there is no need to migrate immediately if the old version is doing the job for you - but it won't be improved or have bug fixes so it's recommended to migrate slowly to 1.0.0.

You can also run both versions at the same time - they won't conflict. Just make sure you rename the API methods or import everything:

```js
const legacyTestDataBot = require('test-data-bot')
const newTestDataBot = require('@jackfranklin/test-data-bot')

const oldBuilder = legacyTestDataBot.build(...)

const newBuilder = newTestDataBot.build(...)
```

## Breaking changes in the new version

### Node 10.13 is required

Previously Node 8 was supported, but now the minimum is 10.13.

### API for declaring fields has changed

Before:

```js
const userBuilder = build('User').fields({
  name: fake(f => f.name.findName()),
});
```

After:

```js
const userBuilder = build('User', {
  fields: {
    name: fake(f => f.name.findName()),
  },
});
```

### `numberBetween` has been removed

`numberBetween` was a shortcut around `fake`. If you need it back you can easily define it:

```js
const { fake } = require('@jackfranklin/test-data-bot');
const numberBetween = (min, max) => fake(f => f.random.number({ min, max }));
```

It's highly recommended to maintain a library of custom matchers that are useful for your application.

### `incrementingId` has been removed

You can now call `sequence()` with no argument to get the same result:

Before:

```js
id: incrementingId();
```

After:

```js
id: sequence();
```

### `arrayOf` has been removed

It was hard to provide a nice API for `arrayOf` that supported all cases. It's now recommended to use the `postBuild` function if you always want an object to have an array of things:

```js
const blogPostBuilder = build('BlogPost', {...})

const userBuilder = build('User', {
  fields: {
    name: fake(f => f.name.findName()),
    blogPosts: [],
  },
  postBuild: user => {
    user.blogPosts = Array(3).fill(undefined).map(_ => blogPostBuilder())
    return user
  }
});
```

### The `map` function has been removed

The old version of test-data-bot provided a map function on each object that it generated. This was confusing and awkward as it meant test-data-bot placed a `map` function on generated objects. If your object had a `map` property, it would be overriden!

This is now replaced by the `postBuild` function.

Before:

```js
const userBuilder = build('User')
  .fields({
    name: fake(f => f.name.findName()),
    email: sequence(x => `jack${x}@test.com`),
  })
  .map(user => ({
    name: user.name.toUpperCase(),
    email: user.email.toUpperCase(),
  }));
```

After:

```js
const userBuilder = build('User', {
  fields: {
    name: fake(f => f.name.findName()),
    email: sequence(x => `jack${x}@test.com`),
  },
  postBuild: user => ({
    name: user.name.toUpperCase(),
    email: user.email.toUpperCase(),
  }),
});
```
