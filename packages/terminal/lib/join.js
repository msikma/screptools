// screptools <https://github.com/msikma/screptools>
// © MIT license

const get = require('lodash.get')
const {padStartEnd} = require('screptools-process').util

/**
 * Returns a set of rep groups with the reps sorted.
 */
const sortRepGroupCollection = (repGroups, sortKey = 'match.date') => {
  // Sort items in each group and pad certain items (matchup strings) for better output.
  for (const [group, groupData] of Object.entries(repGroups)) {
    repGroups[group].reps = sortRepGroup(groupData.reps, sortKey)
  }

  return repGroups
}

/**
 * Sorts an array of processed rep data by one of its raw data values.
 */
const sortRepGroup = (reps, key = 'match.date') => {
  if (key == null) return reps
  return reps.sort((a, b) => get(a.data, key) > get(b.data, key) ? 1 : -1)
}

/**
 * Returns a set of rep groups with the appropriate column sizes determined.
 */
const getRepGroupCollectionColumns = repGroups => {
  // Sort items in each group and pad certain items (matchup strings) for better output.
  for (const [group, groupData] of Object.entries(repGroups)) {
    repGroups[group].columnWidths = getRepGroupColumns(groupData.reps)
  }

  return repGroups
}

/**
 * Returns information about how a group of replay files should be columnized during output.
 * 
 * This can only be done when extended formatting information is available from getTerminalMatchupSummary().
 * Each replay file will have an array of information about the players which can be padded to a column width.
 */
const getRepGroupColumns = repList => {
  const colWidths = []
  for (const rep of repList) {
    const team = rep.extendedData.terminal.teamMatchup
    const cols = team.filter((_, n) => !(n % 2)).flat()
    for (let n = 0; n < cols.length; ++n) {
      colWidths[n] = Math.max(colWidths[n] || 0, cols[n].width)
    }
  }
  return colWidths
}

/**
 * Combines together an array of allies.
 */
 const joinAllies = (allies, arrowPadding = 2) => {
  const arrAllies = padStartEnd('&', arrowPadding)
  return allies.join(arrAllies)
}

/**
 * Pads a single player string to a given width.
 */
const padPlayerString = (player, align, width, colWidth) => {
  const diff = Math.max(colWidth - width, 0)
  if (diff === 0) {
    return player
  }

  const padding = ' '.repeat(diff)
  if (align === 'right') {
    return `${player}${padding}`
  }
  if (align === 'left') {
    return `${padding}${player}`
  }

  return player
}

/**
 * Pads a team matchup to a given array of column widths.
 * 
 * This is done at the very last step, after all replay files have been processed.
 */
const padTeamMatchup = (teams, colWidths) => {
  const teamsPadded = []
  let col = 0

  for (let a = 0; a < teams.length; ++a) {
    // Push odd items verbatim (separators).
    if (a % 2) {
      teamsPadded.push(teams[a])
      continue
    }

    // Even items contain teams and need to be padded.
    const team = teams[a]
    const teamPadded = []
    for (let b = 0; b < team.length; ++b) {
      const colWidth = colWidths[col]
      const playerData = team[b]
      const {string, align, alignPadding, width} = playerData

      const playerPadded = padPlayerString(string, alignPadding, width, colWidth)

      teamPadded.push(playerPadded)
      col += 1
    }
    teamsPadded.push(joinAllies(teamPadded))
  }

  return teamsPadded
}

module.exports = {
  getRepGroupCollectionColumns,
  getRepGroupColumns,
  joinAllies,
  padPlayerString,
  padTeamMatchup,
  sortRepGroup,
  sortRepGroupCollection
}
