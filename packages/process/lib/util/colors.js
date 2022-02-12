// screptools <https://github.com/msikma/screptools>
// © MIT license

const stripAnsi = require('strip-ansi')

/** Colors used for each race. */
const raceColors = {
  P: 'green',
  T: 'blue',
  Z: 'red',
  R: 'cyan'
}

/**
 * Removes all terminal color escape sequences from a string.
 */
const clearColors = str => {
  return stripAnsi(str)
}

/**
 * Returns a terminal color name for a specific race.
 */
const getRaceColor = letter => {
  return raceColors[letter.toUpperCase()]
}

/**
 * Converts an integer number into separate RGB values.
 */
const toRGB = number => {
  const r = (number >> 16) & 0xff
  const g = (number >> 8) & 0xff
  const b = (number) & 0xff
  return [r, g, b]
}

/**
 * Returns the brightness of a given set of RGB values.
 * 
 * By default the value is weighted per each channel's relative brightness.
 */
const toBrightness = (r, g, b, weighted = true) => {
  if (!weighted) {
    return (r + g + b) / 3
  }
  const rW = r * 0.2126
  const gW = g * 0.7152
  const bW = b * 0.0722
  return (rW + gW + bW) / 3
}

/**
 * Returns an RGB array for either white or black.
 * 
 * Used to be able to display readable text on top of a colored background.
 * Note that the default threshold was picked visually.
 */
const pickForegroundRGB = (r, g, b, threshold = 50) => {
  const brightness = toBrightness(r, g, b)
  return brightness > threshold ? [0, 0, 0] : [255, 255, 255]
}

module.exports = {
  clearColors,
  getRaceColor,
  pickForegroundRGB,
  toBrightness,
  toRGB
}
