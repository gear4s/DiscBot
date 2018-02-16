const {deleteMessage} = require(`${__dirname}/inc/func.js`)
const osu = require(`node-osu`)
const TomBotModule = require(`${__dirname}/inc/tombotcmd.js`)

class TomBotOsu extends TomBotModule {
  constructor(client) {
    super(client, "osu! Module")
    this.Discord = require("discord.js")
    this.osuApi  = new osu.Api("b689c0f405b67e003932e85fb025b798a706a5a0", {
        notFoundAsError: true,
        completeScores: false
    })
  }

  secondsToHms(number) {
      number = Number(number)
      var h = Math.floor(number / 3600)
      var m = Math.floor(number % 3600 / 60)
      var s = Math.floor(number % 3600 % 60)
      return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2)
  }

  async cmdBeatmap(info) {
    if (!info.args[0]) return info.msg.reply(`Please include a valid beatmap link.`)

    var link = info.args[0]
    var id = link
    var id = id.substring(id.indexOf("/b/") + 2)
    var id = id.substring(id.indexOf("/s/") + 2)

    if(id.indexOf("&") > -1) id = id.substring(0, id.indexOf('&'))
    if(id.indexOf("?") > -1) id = id.substring(0, id.indexOf('?'))

    const beatmaps = await this.osuApi.getBeatmaps({b: id}).catch(console.log)
    const title = beatmaps[0].title,
          creator = beatmaps[0].creator,
          version = beatmaps[0].version,
          artist  = beatmaps[0].artist,
          bpm     = beatmaps[0].bpm,
          mode    = beatmaps[0].mode,
          approval = beatmaps[0].approvalStatus,
          rating = parseFloat(beatmaps[0].difficulty.rating).toFixed(2),
          plays = beatmaps[0].counts.plays,
          length = secondsToHms(beatmaps[0].time.total),
          thumbnail = 'https://i.imgur.com/Bco94zS.png'

    const beatmapEmbed = new Discord.RichEmbed()
      .setAuthor(`${artist} - ${title} [${version}] [Created by ${creator}]`)
      .setColor("#063cff")
      .addField("Length: ", length, true)
      .addField("BPM: ", bpm, true)
      .addField("Mode: ", mode, true)
      .addField("Status: ", approval, true)
      .addField("Rating: ", `${rating} ★`, true)
      .addField("Plays: ", plays, true)
      .setThumbnail(thumbnail)
      .setURL(link)
      .setFooter(`Linked by: ${info.msg.author.username} (${link})`, info.msg.author.avatarURL)
      
    info.msg.channel.send(beatmapEmbed)
  }

  async cmdOsu(info) {
    if (!info.args[0]) return info.msg.reply("This command requires a user profile link.")

    let link = info.args[0]
    let id = link
    if(/^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(link)) {
      var id = id.substring(id.indexOf("/u/") + 3)

      if(id.indexOf("&") > -1) id = id.substring(0, id.indexOf('&'))
      if(id.indexOf("?") > -1) id = id.substring(0, id.indexOf('?'))
    } else link = "https://osu.ppy.sh/u/"+link

    let getUser
    try {
      getUser = this.osuApi.getUser({u: id})
    } catch(err) {
      if (err.message == "Error: User not found") return info.msg.reply("User not found, make sure you're using a profile link and not a name.")
    }

    const thumbnail = 'https://i.imgur.com/Bco94zS.png'
    const userEmbed = new Discord.RichEmbed()
      .setAuthor(`${getUser.name}'s OSU Statistics`)
      .setColor("#063cff")
      .addField("Plays: ", getUser.count.plays, true)
      .addField("PP: ", getUser.pp.raw, true)
      .addField("Rank: ", getUser.pp.rank, true)
      .addField("Country Rank: ", `${getUser.pp.countryRank} in ${getUser.country}`, true)
      .addField("Level: ", parseFloat(getUser.level).toFixed(2), true)
      .addField("Accuracy: ", getUser.accuracyFormatted, true)
      .setThumbnail(thumbnail)
      .setURL(link)
      .setFooter(`Linked by: ${info.msg.author.username} (${link})`, info.msg.author.avatarURL)
      
      info.msg.channel.send(userEmbed)
  }

  async cmdRecent(info) {
    if (!info.args[0]) return info.msg.reply("Include a username, retard.")

    const name = info.args[0]
    let urecent
    try {
      urecent = (await this.osuApi.getUserRecent({u: name})).shift()
    } catch(e) {
      return console.log(e)
    }

    urecent = urecent
    const score = urecent.score,
          beatmapid = urecent.beatmapId,
          id = urecent.user.id,
          beatmaplink = "https://osu.ppy.sh/b/" + beatmapid,
          fifty = parseInt(urecent.counts['50']),
          hundred = parseInt(urecent.counts['100']),
          threehundred = parseInt(urecent.counts['300']),
          totalhit = Math.floor(fifty + hundred + threehundred),
          maxcombo = urecent.maxcombo,
          rank = urecent.rank,
          pp = urecent.pp || "None",
          missed = urecent.counts.miss,
          thumbnail = 'https://i.imgur.com/Bco94zS.png'

    let user
    try {
      const user = await this.osuApi.getUser({u: id})
      if(user.name != name) return info.msg.reply("That's not a valid account name!")
    } catch(e) {
      return console.log(e)
    }

    let beatmaps
    try {
      beatmaps = await this.osuApi.getBeatmaps({b: beatmapid})
    } catch(e) {
      return console.log(e)
    }

    const beatmapname     = beatmaps[0].title,
          beatmapversion  = beatmaps[0].version,
          beatmapcreator  = beatmaps[0].creator,
          beatmapcombo    = beatmaps[0].maxCombo,
          beatmapdiff     = parseFloat(beatmaps[0].difficulty.rating).toFixed(2),
          beatmapbpm      = beatmaps[0].bpm,
          beatmapmaxcombo = beatmaps[0].maxCombo

    let recentEmbed = new Discord.RichEmbed()
      .setAuthor(`${nam} on ${beatmapname} [${beatmapversion}] by ${beatmapcreator}`, thumbnail)
      .setColor("#063cff")
      .addField("Difficulty: ", `${beatmapdiff} ★`, true)
      .addField("BPM: ", beatmapbpm, true)
      .addField("Max Combo: ", beatmapmaxcombo, true)
      .addField("Score: ", `${score} [${rank}]` , true)
      .addField("Total Hit: ", `${totalhit} out of ${beatmapmaxcombo}`, true)
      .addField("PP Acquired:  ", pp, true)
      .addField("Missed: ", `${missed} out of ${totalhit}`, true)
      .setURL(beatmaplink)
      .setFooter(`Linked by: ${info.msg.author.username}`, info.msg.author.avatarURL)
          
    info.msg.channel.send(recentEmbed)
  }

  init(command) {
    [
      {
        name: "osu",
        permissions: 'NOLIMIT',
        callback: deleteMessage(this.cmdOsu),
        help: "Get osu! user profile statistics",
        usage: "r:username"
      }, {
        name: "recent",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdRecent),
        help: "Get recent statistics for user",
        usage: "r:username"
      }, {
        name: "beatmap",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdBeatmap),
        help: "Get beatmap information",
        usage: "r:beatmapLink"
      }
    ].forEach(command.subcmd)

    return "osu!"
  }
}

module.exports = TomBotOsu
