// screptools <https://github.com/msikma/screptools>
// © MIT license

const {getRaceLetterColorized, getTeamMatchupTable, getFormattedChatMessages} = require('./lib/formatting')
const join = require('./lib/join')
const {terminalConverter} = require('./lib/converter')

/**
 * Returns a matchup summary colorized for the terminal.
 */
const getTerminalMatchupSummary = computedData => {
  return computedData.matchup.races.map(team => team.map(player => getRaceLetterColorized(player[0])).join('')).join('v')
}

/**
 * Returns data for the matchup table, colorized for the terminal.
 */
const getTerminalTeamMatchupTable = (computedData, highlightedPlayerIDs = []) => {
  return getTeamMatchupTable(computedData.matchup.teams, computedData.isMultiplayerFFA, computedData.matchup.winningTeam, highlightedPlayerIDs)
}

/**
 * Returns chat messages colorized for the terminal.
 */
const getTerminalFormattedChatMessages = (computedData, addTimestamps = false) => {
  return getFormattedChatMessages(computedData.chat, addTimestamps)
}

/**
 * Returns the map name and description with control codes colorized for the terminal.
 */
const getTerminalMapData = computedData => {
  return {
    name: terminalConverter.convertMapName(computedData.map.nameRaw),
    description: terminalConverter.convertMapName(computedData.map.descriptionRaw)
  }
}

/**
 * Returns a collection of useful information about the replay file, colorized and formatted for the terminal.
 */
const getTerminalData = (computedData) => {
  const matchupSummary = getTerminalMatchupSummary(computedData)
  const teamMatchup = getTerminalTeamMatchupTable(computedData)
  const chatMessages = getTerminalFormattedChatMessages(computedData)
  const chatMessagesTimestamped = getTerminalFormattedChatMessages(computedData)
  const mapData = getTerminalMapData(computedData)
  return {
    matchupSummary,
    teamMatchup,
    chatMessages,
    chatMessagesTimestamped,
    mapData
  }
}

/**
 * Returns a rep file data object with terminal data added to it.
 */
const addTerminalData = repData => {
  return {
    ...repData,
    extendedData: {
      ...(repData.extendedData ?? {}),
      terminal: getTerminalData(repData.data)
    }
  }
}

module.exports = {
  ...join,
  addTerminalData,
  getTerminalData,
  getTerminalMatchupSummary,
  getTerminalTeamMatchupTable,
  getTerminalFormattedChatMessages
}
