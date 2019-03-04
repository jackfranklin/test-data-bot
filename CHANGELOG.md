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
