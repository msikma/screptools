// screptools <https://github.com/msikma/screptools>
// © MIT license

const {framesToMs, stripEscapeCodes, getSwatchFromSlotID, getSwitchedSwatch, sortRaces, parseMapName} = require('sctoolsdata')
const {getRaceLetter, getFormattedDuration, slugifyString, objectEmpty} = require('./util')

/**
 * Returns the replay file's teams as an object, the key being its team ID and the values being its players.
 */
const groupIntoTeams = playerData => {
  const teamList = [...new Set(playerData.map(player => player.Team))]
  const idKey = teamList.length > 1 ? 'Team' : 'ID'
  const isTeamGame = idKey === 'Team'

  const teams = Object.fromEntries(playerData.map(player => [player[idKey], []]))
  for (const player of playerData) {
    teams[player[idKey]].push(player)
  }
  return [teams, isTeamGame]
}

/**
 * Returns a list of chat messages from during the game.
 */
const getChatMessages = (chatCmds, playerDetails, matchSpeed) => {
  if (!chatCmds) return []
  const playerTable = Object.fromEntries(playerDetails.map(player => [player.slot, player]))
  const chatMessages = chatCmds.map(cmd => {
    const sender = playerTable[cmd.SenderSlotID]
    const messageTime = framesToMs(cmd.Frame, matchSpeed)
    const messageTimeFormatted = getFormattedDuration(messageTime)
    return {
      time: messageTime,
      timeFormatted: messageTimeFormatted,
      senderName: sender.name,
      senderColor: sender.colorSwatch,
      senderRace: sender.race,
      message: cmd.Message
    }
  })
  return chatMessages.sort((a, b) => a.messageTimeMs - b.messageTimeMs)
}

/**
 * Returns player data in a more convenient format.
 */
const getPlayerData = (player, playerDescTable, matchTypeID, teams = [], canonicalID = null) => {
  const colorSwatch = getSwatchFromSlotID(player.Color.ID)
  const colorSwatchSwitched = getSwitchedSwatch(player.Team, matchTypeID)
  const id = player.ID
  const team = teams.find(team => team.players.find(player => player.id === id))
  return {
    id: player.ID,
    slot: player.SlotID,
    name: player.Name,
    race: getRaceLetter(player.Race.Name),
    apm: playerDescTable[player.ID].APM,
    eapm: playerDescTable[player.ID].EAPM,
    teamID: canonicalID ?? team?.canonicalID ?? null,
    colorSwatch,
    colorSwatchSwitched,
    startDirection: playerDescTable[player.ID].StartDirection,
    isCPU: player.ID === 255,
    isObserver: player.Observer
  }
}

/**
 * Returns player data for all players.
 */
const getAllPlayersData = (players, playerDescTable, matchTypeID, teams = []) => {
  return players.map(player => getPlayerData(player, playerDescTable, matchTypeID, teams))
}

/**
 * Returns a "sorted" matchup for 1v1 games.
 * 
 * This sorts the matchup so that the non-mirror matchups are one of {PvT, TvZ, ZvP}.
 */
const makeMatchupSummaries = teamRaces => {
  const is1v1 = teamRaces.length === 2 && teamRaces.every(team => team.length === 1)
  const matchupRaces = teamRaces.map(team => team.map(player => player[0]).join(''))
  const matchupSummary = matchupRaces.join('v')
  const matchupSorted = !is1v1 ? matchupSummary : matchupRaces.sort(sortRaces).join('v')
  return [matchupSummary, matchupSorted]
}

/**
 * Summarizes the teams for this replay.
 * 
 * Only the players that were actually playing (i.e. were not observers) are counted.
 * 
 * Returns two objects: one intended to be merged directly into the output object,
 * and one intended to be its own value.
 */
const processTeamData = (playerData, playerDescTable, matchTypeID, winningTeam) => {
  const [teamMap, isTeamGame] = groupIntoTeams(playerData)
  const teamRaces = Object.values(teamMap).map(players => players.map(player => [player.Race.Name[0], playerDescTable[player.ID].StartDirection]))
  const [matchupSummary, matchupSorted] = makeMatchupSummaries(teamRaces)
  const teams = Object.values(teamMap)

  // Check whether each team has the same ID. This happens when players fight in UMS mode.
  const hasOneID = teams.every(team => team[0].Team === teams[0][0].Team)

  // Collect all teams.
  const teamMatchup = teams.map(team => {
    const id = team[0].Team
    const canonicalID = hasOneID ? team[0].ID : team[0].Team
    const isWinningTeam = id === winningTeam
    const isOnlyCPUs = team.every(player => player.ID === 255)
    const isOnlyHumans = team.every(player => player.ID !== 255)
    const players = team.map(player => getPlayerData(player, playerDescTable, matchTypeID, [], canonicalID))
    return {
      id,
      canonicalID,
      isWinningTeam,
      isOnlyCPUs,
      isOnlyHumans,
      players
    }
  })

  return [
    {matchupSummary, matchupSorted, winningTeam},
    {races: teamRaces, teams: teamMatchup},
    isTeamGame
  ]
}

/**
 * Returns information about the player spawn locations.
 * 
 * Only applicable to a 1v1 on a 4 player map.
 */
const getSpawnData = (mapWidth, mapHeight, startLocations, playerDetails, is1v1, tileSize = 32) => {
  if (!is1v1) return null
  if (!playerDetails.length === 2) return null
  if (!startLocations.length === 4) return null

  // Horizontal and vertical center points of the map.
  const hCenter = (mapWidth * tileSize) / 2
  const vCenter = (mapHeight * tileSize) / 2

  // Determine on what sides of the map each spawn location is.
  const spawnInfo = Object.fromEntries(startLocations.map(loc => {
    const onLeftSide = loc.X < hCenter
    const onTopSide = loc.Y < vCenter
    return [loc.SlotID, {
      onLeftSide,
      onTopSide
    }]
  }))

  // Now figure out how each player's spawn relates to the other.
  const playerSpawnInfo = playerDetails.map(player => spawnInfo[player.slot])
  const onSameHorizontalSide = playerSpawnInfo[0].onLeftSide === playerSpawnInfo[1].onLeftSide
  const onSameVerticalSide = playerSpawnInfo[0].onTopSide === playerSpawnInfo[1].onTopSide
  
  return {
    isCrossSpawns: !onSameHorizontalSide && !onSameVerticalSide,
    isTLBRSpawns: !onSameHorizontalSide && !onSameVerticalSide && playerSpawnInfo[0].onTopSide,
    isBLTRSpawns: !onSameHorizontalSide && !onSameVerticalSide && !playerSpawnInfo[0].onTopSide,
    isCloseSpawns: onSameHorizontalSide || onSameVerticalSide,
    isTopSpawns: onSameVerticalSide && playerSpawnInfo[0].onTopSide,
    isBottomSpawns: onSameVerticalSide && !playerSpawnInfo[0].onTopSide,
    isLeftSpawns: onSameHorizontalSide && playerSpawnInfo[0].onLeftSide,
    isRightSpawns: onSameHorizontalSide && !playerSpawnInfo[0].onLeftSide
  }
}

/**
 * Processes a replay file's raw data and returns useful information we can display to the user.
 */
const processRepData = (repData, filename = null) => {
  if (objectEmpty(repData)) {
    return {}
  }

  const matchType = slugifyString(repData.Header.Type.ShortName)
  const matchTypeID = repData.Header.Type.ID
  const matchDurationFrames = repData.Header.Frames
  const matchSpeed = slugifyString(repData.Header.Speed.Name)
  const matchDuration = framesToMs(matchDurationFrames, matchSpeed)
  const matchDurationFormatted = getFormattedDuration(matchDuration)
  const matchDate = new Date(repData.Header.StartTime)

  const playerData = repData.Header.Players.filter(player => !player.Observer)
  const playerDescTable = Object.fromEntries(repData.Computed.PlayerDescs.map(player => [player.PlayerID, player]))
  const [matchupSummary, matchupDetails, isTeamGame] = processTeamData(playerData, playerDescTable, matchTypeID, repData.Computed.WinnerTeam)
  const playerDetails = getAllPlayersData(repData.Header.Players, playerDescTable, matchTypeID, matchupDetails.teams)

  const playerHumans = playerData.filter(player => player.ID !== 255)
  const playerCPUs = playerData.filter(player => player.ID === 255)

  const playerNames = playerHumans.map(player => player.Name)
  const searchTerms = [...playerNames, filename].filter(t => t)

  const mapName = stripEscapeCodes(repData.MapData.Name).trim()
  const chat = getChatMessages(repData.Computed.ChatCmds, playerDetails, matchSpeed)
  const spawns = getSpawnData(repData.Header.MapWidth, repData.Header.MapHeight, repData.MapData.StartLocations, playerDetails, playerData.length === 2)

  // Check if this is a free for all with more players than two.
  const isMultiplayerFFA = matchupDetails.teams.length > 2 && matchupDetails.teams.every(team => team.players.length === 1)

  // Check whether this is a 1v1 with the same teams. This happens when a 1v1 is played in UMS mode.
  const isSameTeam1v1 = matchupDetails.teams.length === 2 && matchupDetails.teams.every(team => team.id === matchupDetails.teams[0].id)

  const isSoloVsCPU = playerHumans.length === 1 && playerCPUs.length > 0
  const isHumanVsHuman = playerHumans.length > 1 && playerCPUs.length === 0
  const isSoloVsNobody = playerHumans.length === 1 && playerCPUs.length === 0
  const isMultipleHumansVsCPU = playerHumans.length > 1 && playerCPUs.length > 0
  const is1v1 = playerData.length === 2
  
  return {
    ...matchupSummary,
    matchup: {...matchupDetails},
    map: {
      name: mapName,
      nameData: parseMapName(mapName),
      description: stripEscapeCodes(repData.MapData.Description).trim(),
      tileset: slugifyString(repData.MapData.TileSet.Name),
      width: repData.Header.MapWidth,
      height: repData.Header.MapHeight,
      nameRaw: repData.MapData.Name,
      descriptionRaw: repData.MapData.Description
    },
    match: {
      game: slugifyString(repData.Header.Engine.Name),
      type: matchType,
      speed: matchSpeed,
      frames: matchDurationFrames,
      durationFormatted: matchDurationFormatted,
      duration: matchDuration,
      date: matchDate,
      title: repData.Header.Title,
      host: repData.Header.Host
    },
    chat,
    spawns,
    searchTerms,
    isMultiplayerFFA,
    isSameTeam1v1,
    isTeamGame,
    isSoloVsCPU,
    isMultipleHumansVsCPU,
    isHumanVsHuman,
    isSoloVsNobody,
    is1v1
  }
}

module.exports = {
  processRepData
}
