const {shouldDeleteMessages} = require(`${__dirname}/../../assets/settings.json`)

const deleteMessage = cb => {
  return async info => {
    if(shouldDeleteMessages && info.msg.deletable) await info.msg.delete().catch(console.log)
    cb(info)
  }
}

// Song class
const Song = require(`${__dirname}/Song.js`)

// Functions
const checkDJ = msg => msg.member.roles.find(`name`, `DJ`) // Checks if member has roles

const getserver = i => { // Returns server voice connection information
  if(!i.msg.guild.vconn) i.msg.guild.vconn = {queue: []}
  return i.msg.guild.vconn
}

const play = async (connection, info) => { // Plays a song
  const server = getserver(info)
  if(server.queue.length == 0) return
  server.playing = server.queue.shift()
  
  server.playing.play(connection, server)
  
  await info.msg.channel.webhook.yt(await server.playing.info())
  
  server.time = setInterval(() => {
    server.playing.time = (server.playing.time || 0) + 1
  }, 1000)
 
  server.dispatcher.on("end", () => {
    setTimeout(async () => {
      clearInterval(server.time)
      server.playing = false
      if(server.queue.length > 0) {
        play(connection, info)
      } else {
        connection.disconnect()
        await info.msg.channel.webhook.yt({
          color:16711680,
          description:":musical_note: Music queue is empty, the music bot has disconnected until more songs are added."
        })
      }
    }, 1000)
  })
}

const playRadio = async (connection, info, station) => { // Play a radio stream
  const server = getserver(info)
  server.dispatcher = await connection.playStream(station.s)
  server.dispatcher.setVolume(1)
  server.radioplaying = station.name

  server.dispatcher.on("end", function () {
    server.radioplaying = false
    connection.disconnect()
  })
}

module.exports = {
  deleteMessage,
  Song,
  checkDJ,
  getserver,
  play,
  playRadio
}
