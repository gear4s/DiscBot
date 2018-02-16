const Music = require(`${__dirname}/music/music.js`)
const Radio = require(`${__dirname}/music/radio.js`)
const TomBotModule = require(`${__dirname}/inc/tombotcmd.js`)

class TomBotMusic extends TomBotModule {
  constructor(client) {
    super(client, "Music Operations")
  }
  
  async createWebhook(channel) {
    if(channel.type !== "text") return
    const webhooks = await channel.fetchWebhooks()
    const webhook = webhooks.find(wh => wh.name === "WHForBot")
    channel.webhook = webhook || await channel.createWebhook("WHForBot")
    channel.webhook.yt = embed => channel.webhook.send({
      username:"YouTube",
      avatarURL:"http://www.iconsplace.com/icons/preview/blue/youtube-2-256.png",
      embeds:[embed]
    })
  }
  
  async setupWebhooks() {
    for(const [_,guild] of this.client.guilds)
      if(guild.available)
        for(const [_,channel] of guild.channels)
          this.createWebhook(channel)
  
    // Setup per-server webhook
    this.client.on("guildCreate", guild => {
      // Create webhooks in every channel
      for(const [_,channel] of guild.channels)
        if(channel.type == "text")
          this.createWebhook(channel)
    })
    this.client.on("channelCreate", this.createWebhook)
  }
  
  async init(command) {
    this.setupWebhooks()
  
    const MusicLib = require(`${__dirname}/music/music.js`)
    const RadioLib = require(`${__dirname}/music/radio.js`)

    const Music = await MusicLib.init()
    const Radio = await RadioLib.init()
    Music.push(...Radio)
    Music.forEach(command.subcmd)
  }
  
  async deinit(client) {
    client.guilds.forEach(async (guild, guildID) => {
      if(guild.vconn) {
        for (var i = server.queue.length - 1; i >= 0; i--) server.queue.splice(i, 1)
        server.dispatcher.end()
        await server.channel.send("Music is being stopped due to bot being temporarily shut down")
      }
    })
  }
}

module.exports = TomBotMusic
