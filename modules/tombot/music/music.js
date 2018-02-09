const DBClass = require(`${global.rootpath}/lib/db.js`).DB
const {deleteMessage, Song, checkDJ, getserver, play} = require(`${__dirname}/inc/misc.js`)
const ytPlaylist = require(`${__dirname}/../assets/youtube-playlist.js`)
const {_fs} = require(`${global.rootpath}/lib/_fs`)
const {EventEmitter} = require("events")

class TomBotMusicCommand extends EventEmitter {
  constructor() {
    super()
  }

  wrap(callback) {
    return deleteMessage(((info) => {
      this.msg = info.msg
      this.args = info.args

      callback.call(this)
    }).bind(this))
  }

  async cmdWh() {
    console.log(this.msg)
  }

  async cmdPlay() {
    console.log("hmm")
    if(this.args.length === 0)        return this.msg.reply("You must include a youtube link.");
    if(!checkDJ(this.msg))            return this.msg.reply("You must be a DJ to use music commands.");
    if(!this.msg.member.voiceChannel) return this.msg.reply("You must be in a voice channel to use music commands.");

    const match = Song.match(this.args[0]);
    if(!match)                        return this.msg.reply("That link is invalid, please send a correct youtube link.");

    const message = await this.msg.channel.webhook.yt({color:16711680,description:":musical_note: Song added, please wait while it loads."})

    var server = getserver(this)
    server.channel = this.msg.channel
    const songInstance = new Song(match.input, this.msg.author, message)
    server.queue.push(songInstance);

    if(!this.msg.guild.voiceConnection) {
      const connection = await this.msg.member.voiceChannel.join()
      play(connection, this);
    }
  }

  async cmdQueue() {
    const server = getserver(this)
    if(server.queue.length === 0) return this.msg.reply("There are no songs in the queue right now")
    const np = server.playing.__info.songInfo
    const embed = {
      color:16711680,
      description:`__***Now playing:***__\n**[${np.title}](${server.playing.songURL})** (${server.playing.secondsToHms(server.playing.time)}/${np.length})`,
      fields: [
        {
          name: "In queue:",
          value: ""
        }
      ]
    }
    
    let i = 0
    for(const queued of server.queue) {
      if(!queued.__info) {
        const resp = await queued.populateInfo()
        if(resp === -1) {
          embed.fields[0].value += `<error parsing this song>`
          continue
        }
      }
      embed.fields[0].value += `**${++i}: [${queued.__info.songInfo.title}](${queued.songURL})**\n`
    }
    
    this.msg.channel.webhook.yt(embed)
  }

  async cmdVolume() {
    const volume = parseInt(this.args[0])
    if(!checkDJ(this.msg)) return this.msg.reply("You must be a DJ to use music commands.");
    if(!volume)            return this.msg.reply("You need to include a valid volume.");
    if(volume>100)         return this.msg.reply("You are not allowed to go above 100% volume.");
    if(volume<0)           return this.msg.reply("You are not allowed to go below 0% volume.");

    const server = getserver(this);
    server.dispatcher.setVolume(volume/100);
    console.log(`Volume changed by ${this.msg.author.username}`);
  }

  async cmdSkip() {
    var server = getserver(this);

    if(!checkDJ(this.msg)) return this.msg.reply("You must be a DJ to use music commands.")
    if(!server.playing)    return this.msg.reply("No song is playing.")

    if(server.dispatcher) server.dispatcher.end();
    await this.msg.channel.send("SKIPPED")

    console.log(`Song was skipped by ${this.msg.author.username}`);
  }

  async cmdStop() {
    var server = getserver(this);

    if(!checkDJ(this.msg)) return this.msg.reply("You must be a DJ To use music commands.")
    if(!server.playing && !server.radioplaying)    return this.msg.reply("No songs are currently playing...")

    if (this.msg.guild.voiceConnection) {
      if(server.queue) server.queue.splice(0, server.queue.length)
      await this.msg.channel.send(
        server.radioplaying ?
        `You are no longer listening to ${server.radioplaying}` :
        `Music has been stopped!`
      )
      server.dispatcher.end()
      console.log(`Queue was stopped by ${this.msg.author.username}`)
    }
  }

  async cmdPause() {
    var server = getserver(this);

    if(!checkDJ(this.msg)) return this.msg.reply("You must be a DJ To use music commands.")
    if(!server.playing)    return this.msg.reply(`No songs are currently playing...`)

    console.log(`${this.msg.author.username} paused playback.`);
    server.dispatcher.pause();
  }

  async cmdResume() {
    var server = getserver(this.msg);

    if(!checkDJ(this.msg))        return this.msg.reply("You must be a DJ To use music commands.");
    if(!server.playing)           return this.msg.reply(`No songs are currently playing...`);
    if(!server.dispatcher.paused) return this.msg.reply(`No songs are currently paused...`);

    console.log(`${this.msg.author.username} resumed playback.`);
    server.dispatcher.resume();
  }

  async cmdPlaylist() {
    const argument = this.args.shift()
    
    const plFile = new _fs(`${global.rootpath}/plistsaves/${this.msg.guild.id}.playlists.json`)
    if(!plFile.exists) await plFile.writeJson([])
    const playlists = plFile.require
    switch(argument) {
      case "save": {
        if(this.args.length < 2) return this.msg.reply("Please name this playlist")
        if(playlists.indexOf(this.args[1]) > -1) return this.msg.reply("This playlist exists already")
        
        var match = Song.matchList(this.args[0]);
        if(!match[1]) return this.msg.reply("Please supply a valid youtube playlist link!")
        playlists.push(this.args[1])
        plFile.writeJson(playlists)
        const message = await this.msg.reply(`Please wait while we parse the songs in the playlist ..`)
        
        const plistSave = []
        const songs = await ytPlaylist("AIzaSyC3O78ACajIxUYpJlMzhBlunZCvz-8oY2Y", match[1]).catch(console.log);
        const server = getserver(this);
        let i = 0
        let e = 0
        
        const watchPlaylist = async song => {
          const link = "https://www.youtube.com/watch?v=" + song.resourceId.videoId;
          const songInstance = new Song(link, this.msg.author)
          const t = await songInstance.populateInfo()
          if(t === -1) {
            e++
            return
          }
          plistSave.push(songInstance.__info)
          i++

          if((i + e) == songs.length) {
            deleteMessage(message)
            
            const plSaveFile = new _fs(`${global.rootpath}/plistsaves/${this.msg.guild.id}.playlistSave.${this.args[1]}.json`)
            await this.msg.reply("Saved " + i + " items from the playlist successfully with " + e + " errors")
            await plSaveFile.writeJson(plistSave)
          }
        }
        songs.forEach(watchPlaylist)
      }; break;
      
      case "remove": {
        if(playlists.length < 1) this.msg.reply("No playlists have been made.")
        if(!this.args[0]) return this.msg.reply("Please give the name of the playlist you need to remove")
        
        playlists.splice(playlists.indexOf(playlists.find(p=>p==this.args[0])), 1)
        plFile.writeJson(playlists)
        
        await (new _fs(`${global.rootpath}/plistsaves/${this.msg.guild.id}.playlistSave.${this.args[0]}.json`)).unlink()

        this.msg.reply(`Removed playlist.`)
      }; break;

      case "list": {
        if(playlists.length < 1) return this.msg.reply("No playlists have been made.")
        this.msg.reply("Our saved playlists: \n" + playlists.join(", "))
      }; break;

      case "add": {
        if(!playlists.length < 2) return this.msg.reply("No playlists to update")
        if(!this.args[0]) return this.msg.reply("Please name this playlist")
        if(!this.args[1]) return this.msg.reply("Please add a link")

        const link = "https://www.youtube.com/watch?v=" + song.resourceId.videoId;
        const songInstance = new Song(link, this.msg.author)
        const t = await songInstance.populateInfo()
        if(t === -1) return this.msg.reply("Error occurred when adding video")
        
        const plSaveFile = new _fs(`${global.rootpath}/plistsaves/${this.msg.guild.id}.playlistSave.${this.args[1]}.json`)
        const plistSave = plSaveFile.require
        plistSave.push(songInstance.__info)
        plSaveFile.writeJson(plistSave)
      }; break;
      
      default: {
        if(!argument)                     return this.msg.reply("Please include a playlist link.")
        if(!checkDJ(this.msg))            return this.msg.reply("You're actually retarded, try again after you're a DJ... ")
        if(!this.msg.member.voiceChannel) return this.msg.reply("You are required to not be a lonely piece of shit.")

        const server = getserver(this);
        const plLink = argument
        const match = Song.matchList(plLink);
        if(!match) {
          const plSaveFile = new _fs(`${global.rootpath}/plistsaves/${this.msg.guild.id}.playlistSave.${plLink}.json`)
          if(!plSaveFile.exists) return this.msg.reply("You have sent an invalid playlist id or youtube link")
          
          plSaveFile.require.forEach(item => {
            const songItem = new Song(item, this.msg.author)
            server.queue.push(songItem)
          })
        } else {
          const ytplaylist = match[1];
          const songs = await ytPlaylist("AIzaSyC3O78ACajIxUYpJlMzhBlunZCvz-8oY2Y", ytplaylist).catch(console.log);
          for (var i=0; i<songs.length; i++) {
            const link = "https://www.youtube.com/watch?v=" + songs[i].resourceId.videoId;
            const songInstance = new Song(link, this.msg.author)
            server.queue.push(songInstance);
          }
        }

        server.channel = this.msg.channel
        if (!this.msg.guild.voiceConnection) {
          const connection = await this.msg.member.voiceChannel.join()
          play(connection, this)
        }
        console.log(server.queue.size)

        await this.msg.channel.send("ADDED")
      }; break;
    }
  }

  async cmdPlaying() {
    const server = getserver(this)
    if(server.radioplaying) {
      return this.msg.reply(`you're listening to ${server.radioplaying}`)
    }
    if(!server.playing) return this.msg.reply("No songs are currently playing")
    const i = await server.playing.info()
    i.fields[i.fields.length-1].value = server.playing.secondsToHms(server.playing.time) + "/" + i.fields[i.fields.length-1].value
    await this.msg.channel.webhook.yt(i)
  }
}

class TomBotMusic {
  constructor() {
    this.db = new DBClass("playlist")
  }

  async init() {
    await this.db.init()

    const CommandClass = new TomBotMusicCommand()
    return [
      {
        name: "play",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdPlay),
        help: "Play a song from YouTube",
        usage: "r:YoutubeURL"
      }, {
        name: "queue",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdQueue),
        help: "View the song queue",
        usage: "r:YoutubeURL"
      }, {
        name: "playlist",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdPlaylist),
        help: "Plays a youtube playlist in order"
        }, {
        name: "volume",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdVolume),
        help: "Set volume between 0% and 100%",
        usage: "r:volume"
      }, {
        name: "skip",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdSkip),
        help: "Skip the currently playing song"
      }, {
        name: "stop",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdStop),
        help: "Stops the entire queue"
      }, {
        name: "pause",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdPause),
        help: "Pause the currently playing song"
      }, {
        name: "resume",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdResume),
        help: "Resumes the currently playing song"
      }, {
        name: "playing",
        permissions: 'NOLIMIT',
        callback: CommandClass.wrap(CommandClass.cmdPlaying),
        help: "Display the currently playing song"
      }
    ]
  }

  async deinit() {
    await this.db.close()
  }
}

module.exports = new TomBotMusic()