// screptools <https://github.com/msikma/screptools>
// © MIT license

/** Passes through content unchanged. */
const noop = obj => obj

/** Wraps anything in an array if it isn't one already. */
const arrayWrap = obj => Array.isArray(obj) ? obj : [obj]

/** Checks whether something is a string. */
const isString = obj => typeof obj === 'string' || obj instanceof String

/** Checks whether something is an array. */
const isArray = Array.isArray

/** Flips the keys/values of an object. */
const objectFlip = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]))

/** Checks if a string matches against any regular expression in an array.  */
const matchesAny = (str, re, resultIfEmpty = false) => {
  if (re.length === 0) return resultIfEmpty
  return re.map(r => str.match(r) != null).includes(true)
}

/** Escapes a character for use in a regular expression. */
const escapeRegex = str => {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

/** Returns whether a plain object is empty. */
const objectEmpty = obj => Object.keys(obj).length === 0

module.exports = {
  noop,
  arrayWrap,
  objectFlip,
  matchesAny,
  isString,
  isArray,
  objectEmpty,
  escapeRegex
}
