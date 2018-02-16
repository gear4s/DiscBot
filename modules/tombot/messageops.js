const {deleteMessage} = require(`${__dirname}/inc/func.js`)
const TomBotModule = require(`${__dirname}/inc/tombotcmd.js`)

class TomBotMessageControl extends TomBotModule {
  constructor(client) {
    super(client, "Message Operations")
  }

  init(command) {
    [
      {
        name: "purge",
        permissions: 'ADMIN',
        callback: deleteMessage(async info => {
          const limit = parseInt(info.args[0]);
          if(!limit) return info.msg.reply("Enter an actual number, retard.");
          if(limit < 2 || limit > 100) return info.msg.reply("Purge only allows numbers between 2-100.\nExample: `~purge 65`");

          try {
            const msgs = await info.msg.channel.fetchMessages({limit})
            await info.msg.channel.bulkDelete(msgs)
            info.msg.channel.send(`<:white_check_mark:398000723880837130> Successfully removed ${limit} messages from the channel`)
          } catch(e) {
            return console.log(e)
            if(e.endsWith("under 14 days old.")) info.msg.reply("You can only delete messages that are under 14 days old, try using '!tom purge <amount>', otherwise delete them manually.");
          }
        }),
        help: "Purge an amount of messages from the channel",
        usage: "r:purgeAmount"
      }, {
        name: "clear",
        permissions: 'ADMIN',
        callback: deleteMessage(async info => {
          try {
            const msgs = await info.msg.channel.fetchMessages({limit: 100})
            await info.msg.channel.bulkDelete(msgs)
            info.msg.channel.send(`<:white_check_mark:398000723880837130> Successfully removed 100 messages from the channel`)
          } catch(e) {
            return console.log(e)
            if(e.endsWith("under 14 days old.")) info.msg.reply("You can only delete messages that are under 14 days old, try using '!tom purge <amount>', otherwise delete them manually.");
          }
        }),
        help: "Purge 100 messages from the channel",
      }, {
        name: "pub",
        permissions: 'ADMIN',
        callback: deleteMessage(async info => {
          try {
            info.msg.channel.send(`my pid is ${process.pid}`)
          } catch(e) {
            return console.log(e)
            if(e.endsWith("under 14 days old.")) info.msg.reply("You can only delete messages that are under 14 days old, try using '!tom purge <amount>', otherwise delete them manually.");
          }
        }),
        help: "Purge 100 messages from the channel",
      }
    ].forEach(command.subcmd)
  }
}

module.exports = TomBotMessageControl