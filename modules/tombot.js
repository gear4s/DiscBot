'use strict';

const Discord = require("discord.js")
const fs = require('mz/fs');
global.rootpath = process.cwd()

class TomBot {
  constructor(client) {
    this.client = client
    this.name = "TomBot"
    this.mods = []
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
        const modInstance = new mod(this.client)
        await modInstance.init(this.cmd)
        
        this.mods.push(modInstance)
        console.log(`-- Loaded TomBot module ${modInstance.name}`)
      }
    } catch(e) {
      return e
    }
  }
  
  async init() {
    this.createCommandBase()
  
    const error = await this.loadModules()
    if(error) {
      console.log(error)
      return -1
    }
  }
  
  async deinit(c) {
    for(const mod of this.mods) await mod.deinit(c)
  }
}

module.exports = TomBot
