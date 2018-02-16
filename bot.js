"use strict";
// load .env file
require('dotenv').config()

const {EventEmitter} = require("events")
const Discord = require("discord.js")
const {ConfigError} = require("./errors.js")
const fs = require('mz/fs');
const config = require("./config.js")

class DiscBot extends EventEmitter {
  createDefaultEvents() {
    this.config.on(
      "fatal", e => this.emit("fatal", e)
    ).on(
      "error", errorlist => {
        if(errorlist instanceof ConfigError)
          console.error("Your configuration values are invalid:\n-", errorlist.errlist.join("\n- "), "\n\nDefaulting to pre-set values for aforementioned directives and/or objectives")
      }
    )
  }

  initialiseClient() {
    this.client = new Discord.Client()
    this.client.commands = require("./base/command/handler.js")
    this.client.commands.init(this.client, "!")

    this.client.on(
      "ready", async () => {
        this.client.user.setStatus("!help")

        // start loading modules
        let files
        if(this.config.modules === "dynamic") files = await fs.readdir(this.folders.module)
        else files = this.config.modules.map(mod => `${mod}.js`)
        this.config.modules = []
        for(const file of files) {
          // Make one pass and make the file complete
          const stat = await fs.stat(`./modules/${file}`)
          if(stat.isDirectory()) continue

          const modClass = require(`./modules/${file}`)
          const mod = new modClass(this.client)
          console.log(`- Attempting to load module ${mod.name}`)

          await mod.init()
          this.config.modules.push(mod)

          console.log(`- Successfully loaded module ${mod.name}\n `)
        };
        this.emit("ready", {modules: this.config.modules})
      }
    ).on(
      "disconnected", () => {
        console.log("Disconnected!");
        process.exit(1) //exit node.js with an error
      }
    )

    this.client.login(process.env.TOKEN)
  }

  handleProcess() {
    // if it's fatal, don't stay alive
    this.on("fatal", error => {
      console.error("A fatal error occured:", error)
      process.exit(1)
    })

    process.on("unhandledRejection", (reason) => {
      console.error(reason)
      process.exit(1)
    });
    const c = async () => {
      console.log("Gracefully shutting down")
      for(const module of this.config.modules) await module.deinit(this.client)
      process.exit()
    };

    process.setMaxListeners(0)
    process.on("SIGHUP", c)
    process.on("SIGINT", c)
    process.on("SIGQUIT", c)
    process.on("SIGABRT", c)
    process.on("SIGTERM", c)
  }

  init(cb) {
    // already all started :/
    cb(this)
  }

  constructor(options) {
    // first things first
    super()

    this.config = new config(options)
    if(options.events) this.createDefaultEvents()
    this.config.validate()

    this.handleProcess()
    this.initialiseClient()
  }
}

module.exports = DiscBot