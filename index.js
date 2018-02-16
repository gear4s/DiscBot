const DiscordBot = require("./bot.js")

const Bot = new DiscordBot({
  name: "DiscBot",
  events: true,
  modules: [
    "tombot", "groupfinder", "react"
  ],
  folders: {
    module: "modules",
    base: "base",
    libraries: "lib",
    util: "util"
  }
})

Bot.init(async instance => {
  instance.on("ready", ({modules}) => console.log("My bot named " + instance.name + " is now running with " + modules.length + " modules loaded!"))
})
