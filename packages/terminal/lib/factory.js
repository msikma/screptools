// screptools <https://github.com/msikma/screptools>
// © MIT license

const chalk = require('chalk')
const {toRGB} = require('screptools-process').util

/** Pass on the string unchanged for no-ops. */
const noop = str => str

/**
 * Factory function that wraps Chalk for colorized terminal output.
 */
const chalkWrapperFactory = (name, data) => {
  // Invalid colors are rendered black in StarCraft.
  if (data.type === 'INVALID') {
    return chalk.rgb(0, 0, 0)
  }
  // All control codes other than color can be ignored.
  if (!data.color) {
    return noop
  }
  // Convert hex color to RGB bytes.
  const color = toRGB(parseInt(data.color.slice(1), 16))

  return chalk.rgb(...color)
}

module.exports = {
  chalkWrapperFactory
}
