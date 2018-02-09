'use strict';
const client = {}

const con = require(`${global.rootpath}/lib/consoleops.js`)

con.configure({
  using: {
    log: 'module.groupfinder.log',
    debug: 'module.groupfinder.debug',
    error: 'module.groupfinder.error'
  },
  categories: {
    ['module.groupfinder.log']: {
      appenders: ['server', 'console', 'log'],
      level: 'trace'
    },
    ['module.groupfinder.debug']: {
      appenders: ['server', 'console', 'debug'],
      level: 'debug'
    },
    ['module.groupfinder.error']: {
      appenders: ['server', 'console', 'error'],
      level: 'error'
    },
    default: {
      appenders: ['server'],
      level: 'trace'
    }
  }
})

const Discord = require("discord.js")
const fs = require('mz/fs');
const mod = {
  name: "GroupFinder"
}

const listOfGamesInformation = {}

let changedList = true
const proxify = array => new Proxy(array, {
  set: function(target, property, value, receiver) {  
    target[property] = value;
    changedList = true
    return true;
  }
})

const loadedModules = []
mod.init = async (client, logger) => {
  const files = await fs.readdir(`${__dirname}/groupfinder`).catch(e => {
    con.error("Sub-module directory could not be found, aborting", con.isDebug ? `\n${error}` : "")
  })
  for(const file of files) {
    // Make one pass and make the file complete
    const stat = await fs.stat(`${__dirname}/groupfinder/${file}`).catch(e => {
      con.error("Error stating file.", con.isDebug ? `\n${e}` : "")
    })

    if(stat.isDirectory()) {
      continue
    }

    const modArray = []
    const mod = require(`${__dirname}/groupfinder/${file}`)
    const modName = await mod.init(client, proxify(modArray), logger)
    loadedModules.push(mod)

    // insert into table above
    listOfGamesInformation[modName] = [modArray]

    con.log(`-- Loaded GroupFinder module ${modName}`)
  };
  
  setInterval(async () => {
    if(changedList) {
      changedList = false

      for(const [channelID, channelInfo] of client.channels.filter(chan => chan.name == "wow-groupfinder")) {
        const fetched = await channelInfo.fetchMessages({count: 10}).catch(con.error)

        const games = []

        for(const gamename in listOfGamesInformation) {
          games.push()
        }

        if(channelInfo.messages.size === 0) {
          const msg = await channelInfo.send({
            embed: {
              title: "List of testing",
              description: "more testing",
              fields: [
                {
                  name: "even more testing",
                  value: "yes"
                }
              ]
            }
          }).catch(con.error)
        } else {
          const msg = await channelInfo.messages.first().edit({
            embed: {
              title: "List of testing",
              description: "more testing",
              fields: [
                {
                  name: "even more testing",
                  value: "yes"
                },
                {
                  name: "edit testing",
                  value: "it's alive!"
                }
              ]
            }
          }).catch(con.error)
        }
      }
    }
  }, 500)

  return "GroupFinder"
}

mod.deinit = async () => {
  for(const module of loadedModules) await module.deinit()
}

module.exports = {
  name: mod.name,
  init: mod.init,
  deinit: mod.deinit,
}
