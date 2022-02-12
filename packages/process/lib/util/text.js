// screptools <https://github.com/msikma/screptools>
// © MIT license

const slugify = require('slugify')
const formatDuration = require('format-duration')

/**
 * Formats a date to a short human-readable value.
 */
const getFormattedDate = date => {
  const iso = date.toISOString().split('T')
  const t = iso[1].split(':').slice(0, 2)
  return `${iso[0]} ${t.join(':')}`
}

/**
 * Formats a date to a short human-readable value.
 */
const getTimestamp = date => {
  const [d, t] = date.toISOString().split('T')
  const day = d.split('-').slice(-1)
  const time = t.split(':').slice(0, 2)
  return [day[0], time.join('')].join('-')
}

/**
 * Formats a number of milliseconds as a human-readable duration.
 */
const getFormattedDuration = durationMs => {
  return formatDuration(durationMs, {leading: false})
}

/**
 * Pads a string on both sides.
 */
const padStartEnd = (str, amount, padChar = ' ') => {
  const padding = padChar.repeat(amount)
  return `${padding}${str}${padding}`
}

/**
 * Simplifies a string by changing 
 */
const slugifyString = str => slugify(str.trim().toLowerCase(), '_')

module.exports = {
  getFormattedDate,
  getFormattedDuration,
  getTimestamp,
  slugifyString,
  padStartEnd
}
