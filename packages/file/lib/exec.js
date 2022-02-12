// screptools <https://github.com/msikma/screptools>
// © MIT license

const {spawn} = require('child_process')

/** Default options for exec(). */
const defaultOpts = {
  // If true, output is sent to the log function as well (process.stdout and process.stderr by default).
  logged: false,
  // Log functions for stdout and stderr.
  logOutFn: (str, encoding = null) => process.stdout.write(str, encoding),
  logErrFn: (str, encoding = null) => process.stderr.write(str, encoding)
}

/** Default options passed to child_process.spawn(). */
const defaultSpawnOpts = {}

/** Encodes a buffer into a string, if an encoding is specified. */
const encode = (buffer, encoding) => {
  if (encoding) {
    return buffer.toString(encoding)
  }
  return buffer
}

/**
 * Runs exec() and parses the result as JSON.
 * 
 * Defaults to UTF-8 as the encoding. Only stdout data is used for parsing.
 */
const execToJSON = async (cmd, encoding = 'utf8', userOpts = {}, userSpawnOpts = {}) => {
  const result = await exec(cmd, encoding, userOpts, userSpawnOpts)
  return JSON.parse(result.stdout)
}

/**
 * Runs an external command and returns an object with the result and an exit code.
 * 
 * The result is decoded into a string if an encoding is specified, or returned as a Buffer otherwise.
 * Output is split into stdout and stderr, with an additional stdall containing both of them interlaced.
 */
const exec = (cmd, encoding = null, userOpts = {}, userSpawnOpts = {}) => new Promise((resolve, reject) => {
  const opts = {...defaultOpts, ...userOpts}
  const spawnOpts = {...defaultSpawnOpts, ...userSpawnOpts}
  const {logOutFn, logErrFn, logged} = opts

  const proc = spawn(cmd.slice(0, 1)[0], cmd.slice(1), {...spawnOpts})

  const output = {
    stdout: [],
    stderr: [],
    stdall: [],
    code: null,
    signal: null,
    error: null
  }

  /** Returns the final state of the output; only ever called when exiting. */
  const finalize = () => {
    return {
      ...output,
      stdout: encode(Buffer.concat(output.stdout), encoding),
      stderr: encode(Buffer.concat(output.stderr), encoding),
      stdall: encode(Buffer.concat(output.stdall), encoding)
    }
  }

  proc.stdout.on('data', (data) => {
    logOutFn && logged && logOutFn(data)
    output.stdout.push(data)
    output.stdall.push(data)
  })

  proc.stderr.on('data', (data) => {
    logErrFn && logged && logErrFn(data)
    output.stderr.push(data)
    output.stdall.push(data)
  })

  proc.on('close', (code, signal) => {
    output.code = code
    output.signal = signal
    return resolve(finalize())
  })

  proc.on('error', (err) => {
    output.error = err
    return reject(finalize())
  })
})

module.exports = {
  exec,
  execToJSON
}
