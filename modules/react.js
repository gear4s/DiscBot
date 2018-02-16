// Used to save and retrieve information on stuff
const {DB} = require(`${global.rootpath}/lib/db.js`)

class React {
  constructor(client) {
    this.client = client
    this.db = new DB("react")
    this.globalOptions = {}
  }
  
  async cmdSet(info) {
    switch(info.args[0]) {
      case "sendReactionAs": {
        switch(info.args[1]) {
          case "embed": this.globalOptions.sendReactionAs = 0; break
          case "message": this.globalOptions.sendReactionAs = 1; break
          default: return
        }
      }; break
      
      case "sendReactionFrom": {
        switch(info.args[1]) {
          case "webhook": this.globalOptions.sendReactionFrom = 0; break
          case "bot": this.globalOptions.sendReactionFrom = 1; break
          default: return
        }
      }; break
      
      case "webhookName": this.globalOptions.webhookName = info.args[1] || "ReactionWebhook"; break
      default: return
    }
  }
  
  async cmdTo(info) {
    if(info.msg.mentions.size == 0) return info.msg.reply("you need to specify a user to give to")
    
    let gotten
    switch(info.args[1]) {
      // !react to reactionName | @Mention
      // Pipe instead of english
      case "|": {
        if(!/<@!?\d+>/g.test(info.args[2])) return info.msg.reply("please specify a valid user")
        gotten = this.db.get("reactions").filterBy({serverid: info.msg.guild.id, name: info.args[0]})
      } break
      
      // !react to @Mention with reactionName
      // English instead of pipe
      case "with": {
        if(!/<@!?\d+>/g.test(info.args[0])) return info.msg.reply("please specify a valid user")
        gotten = this.db.get("reactions").filterBy({serverid: info.msg.guild.id, name: info.args[2]})
      } break
      
      default: return info.msg.reply("you need to specify a with or a pipe!")
    }

    if(gotten.length == 0) return info.msg.reply("that is an invalid reaction!")
    
    const g = gotten[0]
    const user = await this.client.fetchUser(info.msg.mentions.users.first(), false)
    await info.msg.channel.send(`${user}: ${g.description}.` + (g.resources ? `\n\n${g.resources}` : ""))
  }
  
  async cmdCreate(info) {
    const replies = {}
  
    const createAwait = async (replyIndex, text, unset) => {
      info.msg.reply(text)
      
      const filter = m => m.author.id == info.msg.author.id
      const reply = await info.msg.channel.awaitMessages(filter, {
        max: 1, time: 30000, errors: ['time']
      }).catch(_ => info.msg.reply("this prompt has timed out; prompting for next information"))
      
      replies[replyIndex] = reply.first().content || unset
    }
    
    for(const [index, request, unset] of [
      ['name',        'please give a name to this reaction',                                                null],
      ['description', 'please describe reaction',                                                           'no description set'],
      ['resources',   'what resources would you like for this reaction (all links go here, on newlines)?',  null]
    ]) await createAwait(index, request, unset)
    
    if(!info.msg.guild) await createAwait('serverid', 'which server id will this be used on?', null)
    else replies.serverid = info.msg.guild.id
    
    if(!replies.name) return info.msg.reply("you need to specify a name for your reaction")
    
    info.msg.channel.send("Your reaction has been saved. You may change it's settings using `!react set reaction:reactionName")
    
    replies.authorid = info.msg.author.id
    this.db.insert("reactions", {}, replies)
  }
  
  async cmdList(info) {
    const reactions = this.db.get("reactions").filterBy({serverid: info.msg.guild.id, authorid: info.msg.author.id})
    
    const embed = {title: "List of your reactions on this server", fields: []}
    for(const reaction of reactions) {
      const embedField = {
        name: reaction.name,
        value: reaction.description,
        inline: true
      }
      
      embed.fields.push(embedField)
    }
    
    info.msg.channel.send({embed})
  }
  
  createCommand() {
    this.cmd = this.client.commands.add({
      name: 'react',
      msgType: 'DM',
      permissions: 'NOLIMIT',
      help: 'Reactions module',
      usage: 'r:subcommand;o:...args'
    })
  }
  
  async init(client) {
    await this.db.init()
    
    // Load global options from database
    this.globalOptions = this.db.get("options").find(o => o.name === "globalOptions") || {
      sendReactionAs: 1,
      sendReactionFrom: 1,
      webhookName: "ReactionWebhook"
    }
    
    this.createCommand()

    ;[
      {
        name: 'create',
        permissions: 'NOLIMIT',
        callback: this.cmdCreate.bind(this),
        help: 'Create a reaction to give information to users',
        usage: 'r:promptOptions'
      }, {
        name: 'list',
        permissions: 'NOLIMIT',
        callback: this.cmdList.bind(this),
        help: 'Lists the reactions for this server'
      }, {
        name: 'to',
        permissions: 'NOLIMIT',
        callback: this.cmdTo.bind(this),
        help: 'React to a user with a pre-defined reaction'
      }
    ].forEach(this.cmd.subcmd)
  }
  
  async deinit() {
    await this.db.close()
  }
}

module.exports = React

