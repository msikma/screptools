// screptools <https://github.com/msikma/screptools>
// © MIT license

const {processRepData} = require('screptools-process')
const fs = require('fs').promises
const path = require('path')
const {getScrepData} = require('./lib/screp')

/**
 * Extracts data from a replay file and returns it, plus all relevant metadata.
 * 
 * The returned value contains the following:
 * 
 *     • Raw data from screp
 *     • Computed data, derived from the raw data for convenience
 *     • Metadata for the given file, including a hash
 *     • Information about the screp command that was just run
 * 
 * It's recommended that this code is run again if the installed version of screp is updated.
 */
const getRepData = async filepath => {
  const repData = await getScrepData(filepath)
  const fileStat = await fs.stat(filepath)
  const fileParsed = path.parse(filepath)
  return {
    command: repData.command,
    rawData: repData.data,
    file: {
      filename: path.basename(filepath),
      dir: path.dirname(filepath),
      path: path.resolve(filepath),
      size: fileStat.size,
      hash: repData.hash
    },
    data: processRepData(repData.data, fileParsed.name)
  }
}

module.exports = {
  getRepData
}
