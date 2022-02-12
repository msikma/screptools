// screptools <https://github.com/msikma/screptools>
// © MIT license

/**
 * Returns a letter representing a player's race (T, P, Z).
 */
const getRaceLetter = raceString => {
  return raceString.slice(0, 1).toUpperCase()
}

module.exports = {
  getRaceLetter
}
