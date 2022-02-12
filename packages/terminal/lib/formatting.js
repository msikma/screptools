// screptools <https://github.com/msikma/screptools>
// © MIT license

const chalk = require('chalk')
const stringWidth = require('string-width')
const {getColorFromSwatch} = require('sctoolsdata')
const {getRaceLetter, padStartEnd, getRaceColor, toRGB, pickForegroundRGB} = require('screptools-process').util
const {terminalConverter} = require('./converter')

/**
 * Returns an array of colorized chat messages.
 */
const getFormattedChatMessages = chatItems => {
  const formatted = []
  for (const item of chatItems) {
    const {senderName, senderColor, message, time, timeFormatted} = item
    formatted.push([{formatted: timeFormatted, time}, `${terminalConverter.convertChatMessage(senderName, senderColor, message)}`])
  }
  return formatted
}

/**
 * Returns a string representing a single player in a team.
 */
const makeTeamPlayerString = (playerData, teamA = 0, teamZ = 2, playerA = 0, playerZ = 1, isHighlighted = false, isFFA = false) => {
  const name = playerData.name.trim()
  const colorBg = toRGB(getColorFromSwatch(playerData.colorSwatch).colorInt)
  const colorFg = pickForegroundRGB(...colorBg)
  const raceLetter = getRaceLetter(playerData.race)

  // Pick what side we'll display the race indicator on.
  let align = 'right'
  if (
    // 1v1 match
    (teamA === 0 && teamZ === 2 && playerA === 0 && playerZ === 1) ||
    // Team match
    (playerZ > 1 && (playerA < (playerZ / 2))) ||
    // Free for all
    (isFFA)
  ) {
    align = 'left'
  }

  // What side to add extra padding to in the final output.
  const alignPaddingOpposite = isFFA ? true : false
  const alignPadding = alignPaddingOpposite ? align === 'left' ? 'right' : 'left' : align

  // Format the final player string.
  const player = getPlayerString(name, raceLetter, colorBg, colorFg, align, isHighlighted)
  return {string: player, align, alignPadding, width: stringWidth(player)}
}

/**
 * Returns a string representing a single player.
 */
const getPlayerString = (name, raceLetter, colorBg, colorFg, align = 'left', isHighlighted = false) => {
  const chalkNegFg = chalk.rgb(...colorFg)
  const chalkPosFg = chalk.rgb(...colorBg)
  const chalkBg = chalk.bgRgb(...colorBg)
  const prefix = chalkBg(` ${chalkNegFg(raceLetter)} `)
  const nameHighlighted = isHighlighted ? chalk.underline.bold(name) : name
  return `${align === 'left' ? `${prefix} ` : ''}${chalkPosFg(nameHighlighted)}${align === 'right' ? ` ${prefix}` : ''}`
}

/**
 * Returns a letter representing a player's race (T, P, Z).
 */
const getRaceLetterColorized = raceString => {
  const letter = getRaceLetter(raceString)
  const chalkFg = getRaceColor(letter)
  return chalk[chalkFg](letter)
}

/**
 * Returns a nested array of teams and players.
 * 
 * If the game is a FFA with all teams of one, we'll display the players left-aligned
 * instead of versus-aligned in the final output.
 */
const getTeamStrings = (teams, isMultiplayerFFA, highlightedPlayerIDs = []) => {
  return teams.map((team, teamN) => [
    // Array of all of this team's players.
    team.players.map((player, playerN) =>
      makeTeamPlayerString(player, teamN, teams.length, playerN, team.players.length, highlightedPlayerIDs.includes(player.id), isMultiplayerFFA)
    ),
    // Team or player ID.
    team.canonicalID
  ])
}

/**
 * Returns an object with the data needed to print a table of the team matchup.
 * 
 * This returns an array containing arrays of player information objects, interspersed with separators
 * that are either a bullet or an arrow pointing at a winner.
 * 
 * Player information objects contain the following information:
 * 
 *     - string        player's name, their race, wrapped in terminal color escape codes
 *     - align         preferred text alignment of the string ("left", "right")
 *     - alignPadding  place where padding should be added ("left", "right")
 *     - width         visual width of 'string'
 */
const getTeamMatchupTable = (teams, winningTeam, isMultiplayerFFA, highlightedPlayerIDs = []) => {
  const teamStrings = getTeamStrings(teams, isMultiplayerFFA, highlightedPlayerIDs)
  return combineTeamString(teamStrings, winningTeam)
}

/**
 * Generates strings showing the complete matchup.
 * 
 * The generated string will be formatted differently depending on how many teams
 * there are and how large they are.
 * 
 * Call with the output of getTeamStrings().
 */
const combineTeamString = (teamStrings, winningTeam, arrowPadding = 2) => {
  // The arrow strings we're using to join together the items.
  const arrLoser = padStartEnd('<', arrowPadding)
  const arrWinner = padStartEnd('>', arrowPadding)
  const arrNeutral = padStartEnd('•', arrowPadding)

  // Takes the teamStrings array and adds a null in between the items.
  // This is where the ">", "<" and "v" strings will be.
  const items = [...teamStrings.map(team => [team[0], null]).flat().slice(0, -1)]

  // Iterate over the team strings and set the arrows.
  //
  // This always just sets the arrow directly to the right of this team.
  // The layout is as follows:
  //
  //     x | x | x    - visual representation
  //     0   1   2    - indices for teamStrings
  //     0 1 2 3 4    - indices for items
  //
  for (let a = 0, z = teamStrings.length; a < z - 1; ++a) {
    const [curr, currID] = teamStrings[a]
    const [next, nextID] = teamStrings[a + 1] || []
    
    // Whether the current item is a winner or loser.
    const currIsLoser = currID !== winningTeam && nextID === winningTeam
    const currIsWinner = currID === winningTeam
    const currIsNeutral = currID !== winningTeam && nextID !== winningTeam

    // Arrow index to manipulate.
    const arrNextIdx = (a * 2) + 1
    
    if (currIsLoser) {
      items[arrNextIdx] = arrLoser
    }
    if (currIsWinner) {
      items[arrNextIdx] = arrWinner
    }
    if (currIsNeutral) {
      items[arrNextIdx] = arrNeutral
    }
  }

  return items
}

module.exports = {
  makeTeamPlayerString,
  getRaceLetterColorized,
  getTeamMatchupTable,
  getFormattedChatMessages
}
