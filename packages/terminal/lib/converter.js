// screptools <https://github.com/msikma/screptools>
// © MIT license

const {createTextConverter} = require('sctoolsdata')
const {chalkWrapperFactory} = require('./factory')

const terminalConverter = createTextConverter(chalkWrapperFactory)

module.exports = {
  terminalConverter
}
