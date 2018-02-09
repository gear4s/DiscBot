const log4js = require("log4js")

let using = {}
const configure = (config) => {
  [using.log, using.debug, using.error] = [log4js.getLogger(config.using.log), log4js.getLogger(config.using.debug), log4js.getLogger(config.using.error)]

  log4js.configure({
    appenders: {
      server: {
        type: 'file', filename: 'log/server.log'
      },
      log: {
        type: 'file', filename: 'log/client.log'
      },
      debug: {
        type: 'file', filename: 'log/debug.log'
      },
      error: {
        type: 'file', filename: 'log/error.log'
      },
      console: {
        type: 'console'
      }
    },
    categories: config.categories,
  })
}

const log = (...args) => using.log.log("", ...args)
const info = (...args) => using.log.info("", ...args)

const debug = (...args) => {if(argv.debug) using.debug.debug(...args)}

const error = (...args) => using.error.error(...args)
const fatal = (...args) => using.error.fatal(...args)

const argv = require("minimist")(process.argv.slice(2), {boolean: true});
module.exports = {
    log,
    info,
    debug,
    error,
    fatal,
    configure,

    isdebug: argv.debug,
    logengine: log4js
}
