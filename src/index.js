class Field {
  constructor(name, value) {
    this.name = name
    this.value = value
    this.sequenceStart = 1
  }

  recurseOntoBuilder(builderType, fieldName, nextBuilder) {
    return new Field(
      `${builderType}(${fieldName})`,
      nextBuilder
    ).generateValue()
  }

  generateValue() {
    if (this.value && this.value._testDataBotType) {
      if (this.value._testDataBotType === 'fakeData') {
        return this.value.fakeFn(require('faker'))
      } else if (this.value._testDataBotType === 'sequenceData') {
        const sequenceResponse = this.value.sequenceFn(this.sequenceStart++)
        if (sequenceResponse.hasOwnProperty('_testDataBotType')) {
          return this.recurseOntoBuilder(
            'sequence',
            this.name,
            sequenceResponse
          )
        } else {
          return sequenceResponse
        }
      } else if (this.value._testDataBotType === 'perBuild') {
        return this.value.buildFn()
      } else if (this.value._testDataBotType === 'oneOf') {
        const randomIndex = Math.floor(
          Math.random() * this.value.oneOfOptions.length
        )
        return this.value.oneOfOptions[randomIndex]
      } else if (this.value._testDataBotType === 'arrayOf') {
        return Array.from({ length: this.value.count }).map(_ => {
          return this.recurseOntoBuilder(
            'arrayOf',
            this.name,
            this.value.builder
          )
        })
      } else {
        throw new Error(
          `Unknown test-data-bot type ${this.value._testDataBotType}`
        )
      }
    } else {
      // primitive type so just return it as is
      return this.value
    }
  }
  generateIntoObject(overrides, resultingObject) {
    return Object.assign({}, resultingObject, {
      [this.name]: overrides[this.name] || this.generateValue(),
    })
  }
}

class Builder {
  constructor(name) {
    this.name = name
    this._fields = []
  }

  fields(fieldsObj) {
    Object.keys(fieldsObj).forEach(fieldName => {
      this._fields.push(new Field(fieldName, fieldsObj[fieldName]))
    })

    const builderFuncToReturn = (overrides = {}) =>
      this.buildInstance(overrides)
    builderFuncToReturn.map = fn => this.map(fn)
    return builderFuncToReturn
  }

  buildInstance(overrides = {}) {
    return this._fields.reduce((resultingObject, currentField) => {
      return currentField.generateIntoObject(overrides, resultingObject)
    }, {})
  }

  map(fn) {
    return (overrides = {}) => fn(this.buildInstance(overrides))
  }
}

const build = name => new Builder(name)

const fake = fakeFn => ({
  _testDataBotType: 'fakeData',
  fakeFn,
})

const sequence = sequenceFn => ({
  _testDataBotType: 'sequenceData',
  sequenceFn,
})

const perBuild = buildFn => ({
  _testDataBotType: 'perBuild',
  buildFn,
})

const incrementingId = () => sequence(x => x)

const oneOf = (...oneOfOptions) => ({
  _testDataBotType: 'oneOf',
  oneOfOptions,
})

const arrayOf = (builder, count = 1) => ({
  _testDataBotType: 'arrayOf',
  builder,
  count,
})

const bool = () => oneOf(true, false)

module.exports = {
  build,
  arrayOf,
  fake,
  sequence,
  perBuild,
  incrementingId,
  oneOf,
  bool,
}
