'use strict';

const Discord = require("discord.js")
const fs = require('mz/fs');

class GroupFinder {
  constructor(client) {
    this.client = client
    this.name = "GroupFinder"
    this.changedList = false
    this.loaded = []
    this.gameinfos = {}
  }

  proxify(array) {
    return new Proxy(array, {
      set: function(target, property, value, receiver) {  
        target[property] = value;
        this.changedList = true
        return true;
      }
    })
  }

  async init() {
    try {
      const files = await fs.readdir(`${__dirname}/groupfinder`)
      for(const file of files) {
        // Make one pass and make the file complete
        const stat = await fs.stat(`${__dirname}/groupfinder/${file}`)

        if(stat.isDirectory()) {
          continue
        }

        const modArray = []
        const mod = require(`${__dirname}/groupfinder/${file}`)
        const modName = await mod.init(this.client, this.proxify(modArray))
        this.loaded.push(mod)

        // insert into table above
        this.gameinfos[modName] = [modArray]

        console.log(`-- Loaded GroupFinder module ${modName}`)
      }
      
      // TODO: Make this
      setInterval(async () => {
        if(this.changedList) {
          this.changedList = false
        }
      }, 500)
    } catch(error) {
      console.log("An error has occured:\n",error)
    }
  }

  async deinit() {
    for(const module of this.loaded) await module.deinit()
  }
}

module.exports = GroupFinder
