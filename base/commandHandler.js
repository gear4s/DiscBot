"use strict";
const con = require(`${__dirname}/../lib/consoleops.js`)
const CommandPermissions = require(`${__dirname}/commandPermissions.js`)

con.configure({
  using: {
    log: 'base.command.log',
    debug: 'base.command.debug',
    error: 'base.command.error'
  },
  categories: {
    ['base.command.log']: {
      appenders: ['server', 'console', 'log'],
      level: 'trace'
    },
    ['base.command.debug']: {
      appenders: ['server', 'console', 'debug'],
      level: 'debug'
    },
    ['base.command.error']: {
      appenders: ['server', 'console', 'error'],
      level: 'error'
    },
    default: {
      appenders: ['server'],
      level: 'trace'
    }
  }
})

// Module object
const mod = {}
let prefix = ""

/*
 * Contains commands and their aliases
 * cmds{} format:
 *
 * {
 *   {
 *     callback: callback (function),
 *     permissions: permissions (bits),
 *     scmd: {
 *       {
 *         callback: callback (function),
 *         permissions: permissions (bits)
 *       } (object)
 *     } (object),
 *   {
 *     alias: true,
 *     callback: commandNameThatHasBeenAliased (string)
 *   } (object)
 * }
 */
const cmds = {
  commandList: {},
  commandAliases: {}
}
const cmdhooks = (name) => cmds.commandList[name] || cmds.commandAliases[name]

const checkString = (client, msg, prefix) => {
  //check if message is a command
  if(msg.author.id != client.user.id && msg.content.startsWith(prefix)) {
    con.debug(`treating ${msg.content} from ${msg.author} as command`);
    // Split content and get command name
    const contents = msg.content.split(" ")
    const cmdTxt = contents.shift().substring(prefix.length);

    // Check if a command that's set
    let cmd = cmdhooks(cmdTxt);

    if(cmd) {
      try {
        // If alias was used, retrieve original command
        if(cmd.a) cmd = cmdhooks(cmd.callback)

        // Handling for sub-commands
        let callback = cmd
        if(contents[0]) { // if sub-string is found
          if(callback.scmd && callback.scmd[contents[0]]) { // if sub-command is found
            callback = callback.scmd[contents.shift()] // retrieve sub-command
            if(cmdTxt === "help" && contents[0] && callback.scmd[contents[0]]) // if sub-sub-command is sent and main command is help
              callback = callback.scmd[contents.shift()].callback // get help of sub-command
            else callback = callback.callback
          } else callback = callback.callback
        } else callback = callback.callback

        if(callback === 0) {
          // No callback specified, send help!
          cmds.commandList.help.scmd[cmdTxt].callback({msg})
          return
        }

        // Channel isn't corrrect medium
        if(!CommandPermissions.confirmChannel(msg, cmd.msgType)) return

        // Permissions check
        switch(CommandPermissions.confirm(msg, cmd.permissions)) {
          case CommandPermissions.PERM_ERROR.NO_OWNER:
            msg.reply("that is an owner-only command!"); break
          case CommandPermissions.PERM_ERROR.NO_MOD_ADMIN:
            msg.reply("that command is only for moderators or admins!"); break
          case CommandPermissions.PERM_ERROR.NO_ADMIN:
            msg.reply("that command is only for admins!"); break
          case CommandPermissions.PERM_ERROR.MUTED:
            msg.reply("that command has been muted!"); break
          case CommandPermissions.PERM_ERROR.IGNORE:
            msg.reply("you are being ignored!"); break
          case CommandPermissions.PERM_ERROR.NO_LIMIT: {
            // calling of command. uses fallback if command isn't found
            const fallback = (info) => info.msg.reply(`${cmdTxt} is an unrecognised command!`)
            const fn = callback || fallback

            fn({msg, cmd, args: contents})
          }
        }
      } catch(e) {
        // error handling
        msg.reply("unfortunately, the developer that made that specific command made a mistake! Please contact him for assistance :)")
        con.debug(e)
      }
    } else msg.reply("that's an invalid command!")
  }
}

/*
 * Formats the usage string from commands
 * Example: usageFormatter("r:name,age,sex;o:location,...description")
 * r: Required
 * o: Optional
 * ...: Variable arguments
 * Separate with semicolon
 */
const usageFormatter = (usage) => {
  let ustr = ""

  if(usage && usage != "") {
    const control = usage.split(";")

    for(const v of control) {
      const t = v.split(":")

      if(t[0] == "r") {
        const control = t[1].split(",")

        for(const v of control) {
          ustr += `<${v}> `
        }
      } else if(t[0] == "o") {
        const control = t[1].split(",")

        for(const v of control) {
          ustr += `[${v}] `
        }
      }
    }
  }
  return ustr
}

/*
 * Adds sub-commands to pre-determined commands
 * Example: testCommand.subcmd({name: "this", callback: (info) => info.msg.reply("subcommand testing works"), help: "sub-command testing", usage: "r:usage;o:test"})
 * name: Command name to be used after prefix
 * permissions: Pre-defined bits passed to the command for control
 * callback: Callback for when command is called
 * help: Simple help description
 * usage: Usage string, see above for format
 */
mod.createSubCommand = (parentName, options) => {
  const {
    permissions = 'NO_LIMIT',
    name,
    callback,
    help,
    usage,
  } = options

  if (!name) {
    con.debug("`name` variable must be specified.")
    return
  }

  con.debug(`New sub-command for ${parentName}: ${name}`)
  cmds.commandList[parentName].scmd[name] = {
    callback,
    permissions
  }

  con.debug(`Creating help command for ${parentName} sub-command: ${name}`)
  cmds.commandList.help.scmd[parentName].scmd[name] = {
    callback(info, pre) {
      info.msg.channel.send({
        embed: {
          title: `Help for ${parentName} sub-command ${name}`,
          description: pre || "",
          fields: [
            {
              name: "Description",
              value: help || "None defined"
            },
            {
              name: "Usage",
              value: `${prefix}${parentName} ${name} ${usageFormatter(usage) || ""}`
            }
          ]
        }
      })
    }
  }
}

/*
 * Creates an alias to a command
 * Example: testCommand.alias("testAlias")
 * to: String for parentName of alias
 */
mod.createCommandAlias = (parentName, to) => {
  con.debug(`New alias to command ${parentName}: ${to}`)
  cmds.commandAliases[to] = {
    a: true,
    callback: parentName
  }
  cmds.commandList.help.scmd[parentName] = {
    callback: (info) => cmds.commandList.help.scmd[cmdcallback].callback(info, `Alias to ${parentName}`)
  }
}

/*
 * Adds a command to the register
 * Example: const testCommand = mod.add("test", 'NO_LIMIT', info => info.msg.reply(`testing works, ${info.args[1]}`), "Testing command", "o:string")
 * Example 2: const testCommand = mod.add({name: "test", permissions: mod.PERMISSIONS.NO_LIMIT, callback: info => info.msg.reply(`testing works, ${info.args[1]}`), help: "Testing command", usage: "o:string"})
 * name: Command name to be used after prefix
 * permissions: Pre-defined bits passed to the command for control
 * callback: Callback for when command is called
 * help: Simple help description
 * usage: Usage string, see above for format
 */
mod.createCommand = (name, permissions, callback, help, usage, msgType) => {
  if(typeof name == "object") {
    // objectified
    permissions = name.permissions || 'NO_LIMIT'
    callback = name.cb || 0
    help = name.help || ""
    usage = name.usage || ""
    name = name.name || 0
    msgType = name.type || 'CHAN'
  }

  msgType = msgType || 'CHAN'

  if(!name) return con.debug("`name` variable must be specified.")
  con.debug(`New command specified: ${name}`)
  cmds.commandList[name] = {
    callback,
    permissions,
    msgType,
    scmd: {}
  }
  con.debug(`Creating help command for: ${name}`)
  cmds.commandList.help.scmd[name] = {
    scmd: {},
    callback: (info, pre) => {
      const embedObject = {
        title: `Help for ${name}`,
        description: pre || "",
        fields: [
          {
            name: "Description",
            value: help || "None defined"
          },
          {
            name: "Usage",
            value: `${prefix}${name} ${usageFormatter(usage) || ""}`
          }
        ]
      }

      if(Object.keys(cmds.commandList[name].scmd).length > 0 && name != "help")
        embedObject.fields.push({
          name: "Sub-commands",
          value: Object.keys(cmds.commandList[name].scmd).map((k, i) => k).join(", ")
        })
      info.msg.channel.send({embed: embedObject})
    }
  }

  return {
    subcmd: (...args) => mod.createSubCommand(name, ...args),
    alias: (...args) => mod.createCommandAlias(name, ...args)
  }
}

mod.createCommand("help", 'NO_LIMIT', (info) => {
  if(info.args != "") return info.msg.reply(info.msg.nick, "Unrecognized command")

  info.msg.channel.send({
    embed: {
      title: "List of commands",
      description: Object.keys(cmds.commandList).map((key) => key).join(", ") || "None defined",
      fields: [
        {
          name: "List of command aliases",
          value: Object.keys(cmds.commandAliases).map((key) => `${key} => ${cmds.commandAliases[key].callback}`).join(", ") || "None defined"
        }
      ]
    }
  })
}, "Returns information on commands and sub-commands", "o:command,subcommand", 'CHAN')

mod.init = (client, pre) => {
  client.on("message", (msg) => checkString(client, msg, "!"))
  prefix = pre
}

module.exports = {
  add: mod.createCommand,
  PERMISSION: mod.PERMISSION,
  MSG_TYPE: mod.MSG_TYPE,
  init: mod.init
}
