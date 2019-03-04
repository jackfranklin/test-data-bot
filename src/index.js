const Generator = require('./generator')

class Field {
  constructor(name, generator) {
    this._name = name
    this._generator = generator
    this._sequenceCount = 1
  }

  generateValue() {
    if (this._generator instanceof Generator) {
      return this._generator.generate({
        sequenceCount: this._sequenceCount++,
      })
    } else {
      // must be a primitive value
      return new Generator().fullyExpandReturn(
        this._generator,
        this._sequenceCount++
      )
    }
  }

  generateIntoObject(overrides, resultingObject) {
    return Object.assign({}, resultingObject, {
      [this._name]: overrides.hasOwnProperty(this._name)
        ? overrides[this._name]
        : this.generateValue(),
    })
  }
}

class Builder {
  constructor(name) {
    this._name = name
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

const fake = fakeFn =>
  new Generator('fake', {
    fakeFn,
  })

const sequence = sequenceFn =>
  new Generator('sequence', {
    sequenceFn,
  })

const perBuild = buildFn =>
  new Generator('perBuild', {
    buildFn,
  })

const incrementingId = () => sequence(x => x)

const oneOf = (...oneOfOptions) =>
  new Generator('oneOf', {
    oneOfOptions,
  })

const arrayOf = (builder, count = 1) =>
  new Generator('arrayOf', {
    builder,
    count,
  })

const bool = () => oneOf(true, false)

const numberBetween = (min, max) => fake(f => f.random.number({ min, max }))

module.exports = {
  build,
  arrayOf,
  fake,
  sequence,
  perBuild,
  incrementingId,
  oneOf,
  bool,
  numberBetween,
}
