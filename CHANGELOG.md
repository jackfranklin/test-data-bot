### Unreleased

- Added `many(N)` as a helper method to create an array of `N` instances. [PR](https://github.com/jackfranklin/test-data-bot/pull/899).

### 2.0.0 - 17 Mar 2022

- **BREAKING** Removed Faker support. If you wish to use it, you may, and you can use the `perBuild` generator to integrate it. [PR](https://github.com/jackfranklin/test-data-bot/pull/603).
- **BREAKING** Various TypeScript changes to improve type-safety of builders. May cause values that were previously `any` to be typed more strictly, and hence may need code changes [PR](https://github.com/jackfranklin/test-data-bot/pull/605).
- **BREAKING** Dropped support for Node 10. Minimum Node version is now 12.
- Dropped the dependency on Lodash [PR](https://github.com/jackfranklin/test-data-bot/pull/650).

### 1.4.0 - 09 Dec 2021

_Sorry for the lack of updates and silence! I'm hopeful that I can maintain this library more proactively moving forwards and continue to improve test-data-bot._

- Updated Faker to latest version (v5.5.3)
- Support non-truthy values in overrides [PR](https://github.com/jackfranklin/test-data-bot/pull/288)
- Various dependency updates: latest TypeScript, Prettier, ESLint, Jest, and so on.

### 1.3.0 - 13 May 2020

- Added traits to test-data-bot. See the README for examples.


### 1.2.0 - 09 May 2020

- Factories now do not need a factory name property. You can simply pass in the configuration object :
  ```js
  const userBuilder = build({ ... });
  // rather than:
  const userBuilder = build('User', { ... });
  ```

  You can still pass a name if you like, but it's not required and will probably be removed in a future major version.

### 1.1.0 - 23 March 2020

- Fix: builders can now take literal `null` or `undefined` values: https://github.com/jackfranklin/test-data-bot/pull/198
- Fix: `sequence` returns `unknown` not `number`: https://github.com/jackfranklin/test-data-bot/pull/196
- Fix: ship Faker types for nice type hinting:  https://github.com/jackfranklin/test-data-bot/pull/197
- Upgrade to Prettier 2: https://github.com/jackfranklin/test-data-bot/pull/195
- Swap from `yarn` to `npm`: https://github.com/jackfranklin/test-data-bot/pull/194


### 1.0.0 - 26 January 2020

- Completely new version! See README for migration details.


### 0.8.0 - 04 March 2019

- Add `numberBetween` - [PR by @spilist](https://github.com/jackfranklin/test-data-bot/pull/43).

### 0.7.1 - 20 Feb 2019

- Fix passing primitive values like `null` or `undefined` to a builder. (https://github.com/jackfranklin/test-data-bot/issues/39)

### 0.7.0 - 24 Jan 2019

- Fix a bug where you were unable to pass plain functions in as values to builders
- Fix `arrayOf` behaviour so it can take a builder and correctly call it.

### 0.6.1- 01 Dec 2018

- fix bug that meant overriding a boolean to always be `false` wouldn't happen (https://github.com/jackfranklin/test-data-bot/issues/6)

### 0.6.0- 03 August 2018

- rebuilt to enable fully nested builders

### 0.5.0- 03 August 2018

- add `arrayOf`
- add `bool`
- Enable `sequence` to take other builders.

### 0.4.0- 19 July 2018

- add `oneOf` and `incrementingId`

### 0.3.0- 13 June 2018

- Fix `main` in `package.json` not pointing in the right place- PR by [Kent C. Dodds](https://github.com/jackfranklin/test-data-bot/pull/1)

### 0.2.0- 12 June 2018

- Added `perBuild` generator.

### 0.1.0- 11 June 2018

- First release!
