"use strict";
const Discord = require("discord.js");
const client = new Discord.Client();
const con = require(`${__dirname}/lib/consoleops.js`)

process.env = {
  TOKEN: "MzY0ODUwMzQyMDU3MjEzOTYy.DUR-6w.dOb_mxQPQ6Lxp9GEAMaCh3YjRkM",
  BNET_API: "h9tfawgr7u6zafdeyfzqe4p9thmf49kw"
}

global.rootpath = __dirname

con.configure({
  using: {
    log: 'clientLog',
    debug: 'clientDebug',
    error: 'clientError'
  },
  categories: {
    clientLog: {
      appenders: ['server', 'console', 'log'],
      level: 'trace'
    },
    clientDebug: {
      appenders: ['server', 'console', 'debug'],
      level: 'debug'
    },
    clientError: {
      appenders: ['server', 'console', 'error'],
      level: 'error'
    },
    default: {
      appenders: ['server'],
      level: 'trace'
    }
  }
})

client.commands = require("./base/commandHandler.js")
client.commands.init(client, "!")

process.on("unhandledRejection", (reason) => {
  con.error(reason);
  process.exit(1);
});

/<meta name="keywords" content="([\w, ]*)" \/>\n<meta name="apple-itunes-app" content="app-id=431946152" \/>\n<meta name="google-site-verification" content="KjufnQUaDv5nXJogvDMey4G-Kb7ceUVxTdzcMaP9pCY" \/>/g.test(`<meta name="keywords" content="free games, online games, building games, virtual worlds, free mmo, gaming cloud, physics engine" />
<meta name="apple-itunes-app" content="app-id=431946152" />
<meta name="google-site-verification" content="KjufnQUaDv5nXJogvDMey4G-Kb7ceUVxTdzcMaP9pCY" />`)

const fs = require('mz/fs');
const modules = []
client.on("ready", async () => {
  con.log("Logged in to discord!");
  client.user.setStatus("!help")

  // start loading modules
  con.log("Loading modules ...")
  const files = await fs.readdir("./modules").catch(e => {
    con.error("Module directory could not be found, aborting", con.isDebug ? `\n${error}` : "")
    process.exit( 1 )
  })
  for(const file of files) {
    // Make one pass and make the file complete
    const stat = await fs.stat(`./modules/${file}`).catch(e => {
      con.error("Error stating file.", argv.isDebug ? `\n${e}` : "")
    })

    if(stat.isDirectory()) {
      continue
    }

    const mod = require(`./modules/${file}`)
    con.log(`- Attempting to load module ${mod.name}`)
    await mod.init(client)
    modules.push(mod)
    con.log(`- Successfully loaded module ${mod.name}\n `)
  };
  con.log(`Bot started successfully, ${modules.length} modules loaded\n`)
});

client.on("disconnected", () => {
  con.log("Disconnected!");
  process.exit(1); //exit node.js with an error
});

var c = async () => {
  con.log("Gracefully shutting down");
  for(const module of modules) await module.deinit(client)
  process.exit();
};

process.setMaxListeners(0)
process.on("SIGHUP", c);
process.on("SIGINT", c);
process.on("SIGQUIT", c);
process.on("SIGABRT", c);
process.on("SIGTERM", c);

client.login(process.env.TOKEN);
