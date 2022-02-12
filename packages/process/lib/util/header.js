// screptools <https://github.com/msikma/screptools>
// © MIT license

const {objectEmpty} = require('./data')
const {stringSha1} = require('./sha1')

/**
 * Returns a unique sha1 hash for a given rep file.
 * 
 * The hash is generated using header data, which is (probably) sufficiently
 * unique that there is no chance of collisions.
 */
const getRepHeaderHash = (repData) => {
  // If an error occurred, repData will have no data.
  if (objectEmpty(repData)) {
    return null
  }

  // The following data is more than enough to guarantee a unique ID
  // without having to actually hash the entire file.
  const data = [
    repData.Header.Engine.ID,
    Number(new Date(repData.Header.StartTime)),
    repData.Header.Frames,
    repData.Header.Title,
    repData.Header.Speed.ID,
    repData.Header.Type.ID,
    repData.Header.SubType,
    repData.Header.Map,
    repData.Header.Players.map(player => [player.Name, player.Race.ID])
  ]
  if (data.includes(null)) {
    throw new Error(`File data has 'null' in it: ${JSON.stringify(data)}`)
  }
  return stringSha1(JSON.stringify(data))
}

module.exports = {
  getRepHeaderHash
}
