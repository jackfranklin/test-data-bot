class Field {
  constructor(name, value) {
    this.name = name
    this.value = value
    this.sequenceStart = 1
  }

  generateValue() {
    if (this.value && this.value._testDataBotType) {
      if (this.value._testDataBotType === 'fakeData') {
        return this.value.fakeFn(require('faker'))
      } else if (this.value._testDataBotType === 'sequenceData') {
        return this.value.sequenceFn(this.sequenceStart++)
      } else if (this.value._testDataBotType === 'perBuild') {
        return this.value.buildFn()
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

module.exports = { build, fake, sequence, perBuild, incrementingId }
