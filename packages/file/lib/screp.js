// screptools <https://github.com/msikma/screptools>
// © MIT license

const {objectEmpty, getRepHeaderHash} = require('screptools-process').util
const commandExists = require('command-exists')
const pick = require('lodash.pick')
const {exec} = require('./exec')

/**
 * Error wrapper for throwing results reported by screp.
 */
class ScrepError extends Error {
  constructor(result) {
    super()
    this.message = `screp could not parse the file: ${result.command.error}`
    this.result = result
  }
}

/**
 * Returns a screp command to execute as array.
 * 
 * Normally one should not pass options to this function, since the default options are appropriate.
 */
const getScrepCmd = (filepath, userOpts = {}) => {
  const opts = {useCmds: true, useComputed: true, useHeader: true, useMap: true, useMapRes: false, useMapTiles: false, ...userOpts}

  const args = ['screp']
  opts.useCmds && args.push('-cmds')
  opts.useComputed && args.push('-computed')
  opts.useHeader && args.push('-header')
  opts.useMap && args.push('-map')
  opts.useMapRes && args.push('-mapres')
  opts.useMapTiles && args.push('-maptiles')

  // Request without indentation since we're parsing the data anyway.
  args.push('-indent=0')

  args.push(`${filepath}`)

  return {opts, args}
}

/**
 * Checks whether the screp command is available.
 * 
 * Either returns "screp" or throws an error.
 */
const isScrepAvailable = () => {
  return commandExists('screp')
}

/**
 * Returns information about the available screp binary in an object.
 * 
 * The information is obtained by running 'screp -version' and then parsed.
 * 
 * Only information pertinent to parsing is returned. This is used to determine if entries
 * need to be re-scanned and re-entered into the database (when screp is updated).
 */
const getScrepVersion = async () => {
  const data = (await exec(['screp', '-version'], 'utf8')).stdout.trim().split('\n')
  const values = data.map(line => line.match(/(.+?):(.+?)$/).slice(1).map(item => item.trim()))
  const simplified = Object.fromEntries(values.map(([key, value]) => [key.toLowerCase(), value]))
  return pick(simplified, ['screp version', 'parser version', 'eapm algorithm version', 'built with'])
}

/**
 * Runs screp and checks whether the output is valid JSON or an error.
 */
const parseScrepOutput = async (cmdArgs) => {
  const res = await exec(cmdArgs, 'utf8')
  try {
    const json = JSON.parse(res.stdout)
    return [json, null, null]
  }
  catch (err) {
    // A SyntaxError probably means screp reported an error.
    // In this case we ignore it and only pass on screp's output.
    if (err.name === 'SyntaxError') {
      return [{}, null, res.stdall.trim()]
    }
    return [{}, err, null]
  }
}

/**
 * Returns the screp JSON data for a StarCraft replay file.
 * 
 * Requires that the screp command line utility is available:
 * <https://github.com/icza/screp>
 */
const getScrepData = async filepath => {
  try {
    await isScrepAvailable()
  }
  catch {
    throw new Error(`the 'screp' command line tool is not available. Please install it from <https://github.com/icza/screp>.`)
  }
  const cmd = getScrepCmd(filepath)
  const [data, error, output] = await parseScrepOutput(cmd.args)
  const hash = getRepHeaderHash(data)
  const result = {
    command: {
      arguments: cmd.args,
      options: cmd.opts,
      binary: await getScrepVersion(),
      error: output
    },
    data,
    hash
  }

  // If a regular error occurred, throw the error.
  if (error) {
    throw error
  }

  // If screp returned an error, throw the whole result object.
  if (result.command.error) {
    throw new ScrepError(result)
  }

  return result
}

module.exports = {
  getScrepData
}
