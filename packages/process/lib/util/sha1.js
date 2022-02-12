// screptools <https://github.com/msikma/screptools>
// © MIT license

const sha1 = require('tiny-sha1')

/**
 * Returns a sha1 hash for a string.
 */
const stringSha1 = str => {
  const enc = new TextEncoder()
  const hash = sha1(enc.encode(str))
  return hash
}

module.exports = {
  stringSha1
}
