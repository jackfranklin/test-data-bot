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
      }
    } else {
      // primitive type so just return it as is
      return this.value
    }
  }
  generateIntoObject(resultingObject) {
    return Object.assign({}, resultingObject, {
      [this.name]: this.generateValue(),
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

    return (overrides = {}) => this.buildInstance(overrides)
  }

  buildInstance(overrides = {}) {
    return this._fields.reduce((resultingObject, currentField) => {
      return currentField.generateIntoObject(resultingObject)
    }, {})
  }
}

const build = name => new Builder(name)

const fakeData = fakeFn => ({
  _testDataBotType: 'fakeData',
  fakeFn,
})

const sequenceData = sequenceFn => ({
  _testDataBotType: 'sequenceData',
  sequenceFn,
})

module.exports = { build, fakeData, sequenceData }
