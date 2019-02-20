class Generator {
  constructor(type, data) {
    this.type = type
    this.data = data
  }

  fullyExpandReturn(value, nextSequence) {
    if (Object(value) !== value) {
      // this means value is primitive and we should just return it
      return value
    } else if (value instanceof Generator) {
      return value.generate({
        sequenceCount: nextSequence,
      })
    } else if (Array.isArray(value)) {
      return value.map(v => this.fullyExpandReturn(v, nextSequence))
    } else if (value.name === 'builderFuncToReturn') {
      return value()
    } else if (typeof value === 'object') {
      return Object.keys(value).reduce((newObj, currentKey) => {
        const newValue = value[currentKey]
        newObj[currentKey] = this.fullyExpandReturn(newValue, nextSequence)
        return newObj
      }, {})
    } else if (typeof value === 'function') {
      return value
    } else {
      console.error(
        'test-data-bot does not know how to handle the given value',
        value
      )
      console.error(
        'please report this as an issue: https://github.com/jackfranklin/test-data-bot/issues/new'
      )
      return value
    }
  }

  generate({ sequenceCount }) {
    switch (this.type) {
      case 'fake':
        return this.data.fakeFn(require('faker'))

      case 'sequence':
        return this.fullyExpandReturn(
          this.data.sequenceFn(sequenceCount),
          ++sequenceCount
        )

      case 'oneOf':
        const randomIndex = Math.floor(
          Math.random() * this.data.oneOfOptions.length
        )
        return this.fullyExpandReturn(
          this.data.oneOfOptions[randomIndex],
          sequenceCount
        )

      case 'perBuild':
        return this.fullyExpandReturn(this.data.buildFn(), sequenceCount)

      case 'arrayOf':
        return Array.from({ length: this.data.count }).map(_ => {
          if (this.data.builder instanceof Generator) {
            return this.data.builder.generate({
              sequenceCount: sequenceCount++,
            })
          } else if (
            typeof this.data.builder === 'function' &&
            this.data.builder.name === 'builderFuncToReturn'
          ) {
            return this.data.builder()
          } else {
            return this.data.builder
          }
        })

      default:
        break
    }
  }
}

module.exports = Generator
