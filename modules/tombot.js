'use strict';

const Discord = require("discord.js")
const fs = require('mz/fs');

class TomBot {
  constructor() {
    this.name = "TomBot"
    this.mods = []
    
    this.con = require(`${__dirname}/../lib/consoleops.js`)
    this.con.configure({
      using: {
        log: 'module.tombot.log',
        debug: 'module.tombot.debug',
        error: 'module.tombot.error'
      },
      categories: {
        ['module.tombot.log']: {
          appenders: ['server', 'console', 'log'],
          level: 'trace'
        },
        ['module.tombot.debug']: {
          appenders: ['server', 'console', 'debug'],
          level: 'debug'
        },
        ['module.tombot.error']: {
          appenders: ['server', 'console', 'error'],
          level: 'error'
        },
        default: {
          appenders: ['server'],
          level: 'trace'
        }
      }
    })
  }
  
  createCommandBase() {
    this.cmd = this.client.commands.add({
      name: "tom",
      msgType: 'DM',
      permissions: 'NOLIMIT',
      help: "TomBot module",
      usage: "r:subcommand;o:...args"
    });
  }
  
  async loadModules() {
    try {
      const files = await fs.readdir(`${__dirname}/tombot`)

      for(const file of files) {
        // Make one pass and make the file complete
        const stat = await fs.stat(`${__dirname}/tombot/${file}`)

        if(stat.isDirectory()) {
          continue
        }

        const mod = require(`${__dirname}/tombot/${file}`)
        await mod.init(this.client, this.cmd, this.con)
        
        this.mods.push(mod)
        this.con.log(`-- Loaded TomBot module ${mod.name}`)
      }
    } catch(e) {
      return e
    }
  }
  
  async init(client) {
    this.client = client
    this.createCommandBase()
  
    const error = await this.loadModules()
    if(error) {
      this.con.error(error)
      return -1
    }
  }
  
  async deinit(c) {
    for(const mod of this.mods) await mod.deinit(c)
  }
}

module.exports = new TomBot()
