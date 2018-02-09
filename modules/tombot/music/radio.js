const {deleteMessage, checkDJ, playRadio, getserver} = require(`${__dirname}/inc/misc.js`)

const {EventEmitter} = require("events")
class TomBotRadio extends EventEmitter {
  constructor(client) {
    super()
    this.client = client
  }

  async cmdRadio() {
    if(!checkDJ(info.msg)) return info.msg.reply("You must be a DJ to use music commands.")
    if(!info.msg.member.voiceChannel) return info.msg.reply("You must be in a voice channel to use music commands.")

    const stationList = [
      {id: "moe",      s: "https://listen.moe/stream",                           name: "Listen.Moe"},
      {id: "mix",      s: "rtmp://wzwa.scahw.com.au/live/6mix_32.stream",        name: "Mix 94.5 Perth"},
      {id: "hit",      s: "rtmp://wzwa.scahw.com.au/live/6ppm_32.stream",        name: "Hit 92.9 Perth"},
      {id: "nova",     s: "http://streaming.novaentertainment.com.au/nova937",   name: "Nova 93.7"},
      {id: "smooth",   s: "http://streaming.novaentertainment.com.au/smooth915", name: "SmoothFM 91.5"}
    ]
    if(!info.args[0]) return info.msg.reply(
      "Current radio stations:\n" + stationList.map(i => `\`'${i.id}' (${i.name})\``).join(" ") +
      "or use `'random'` to get a random channel!"
    )

    if(info.msg.guild.voiceConnection) return message.reply(`there is already something being played!`);

    const station = info.args[0] == "random" ?
                    stationList[Math.floor(Math.random() * (stationList.length - 1))] :
                    stationList.find(i => i.id == info.args[0]);
    if(!station) return info.msg.reply("That station doesn't exist.");

    if (!info.msg.guild.voiceConnection) {
      const connection = await info.msg.member.voiceChannel.join()
      const server = getserver(info)
      playRadio(connection, info, station)
    }

    await info.msg.channel.send(`Now playing ${station.name}`)
  }

  async init() {
    //await this.db.init()

    return [
      {
        name: "stream",
        permissions: 'NOLIMIT',
        callback: deleteMessage(this.cmdRadio),
        help: "Play a radio station stream",
        usage: "r:station"
      },
      {
        name: "addstream",
        permissions: 'NOLIMIT',
        callback: deleteMessage(() => {}),
        help: "",
        usage: "r:stationName,stationStream"
      }
    ]
  }

  async deinit() {
    //await this.db.close()
  }
}

module.exports = new TomBotRadio()