const ytdl    = require(`ytdl-core`);

class Song {
  constructor(url, author, message) {
    this.author = author
    if(typeof url === "object") {
      this.songURL = "https://youtube.com/watch?v="+url.videoInfo.id
      this.songID = url.videoInfo.id
      this.__info = url
      return
    }
    this.message = message
    this.songURL = "https://youtube.com/watch?v="+Song.match(url)[1]
    this.songID = Song.match(url)[1]
    this.author = author
  }

  secondsToHms(number) {
    number = Number(number);
    let h = Math.floor(number / 3600);
    let m = Math.floor(number % 3600 / 60);
    let s = Math.floor(number % 3600 % 60);
    h = h>0 ? (('0' + h).slice(-2) + ":") : ""
    return  h + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
  }
  
  static match(url) {
    return url.match(/^(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/)(?:embed\/|watch\?(?:.+&))v(?:\/|=)((.|-){11})(?:\S+)?$/)
  }
  static matchList(url) {
    return url.match(/^(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/(?:embed\/|list\/|watch\?list=|watch\?.+&list=))([a-zA-Z0-9_-]+)(?:\S+)?$/)
  }

  play(connection, server) {
    server.dispatcher = connection.playStream(ytdl(this.songURL, {filter: `audioonly`}), {seek: 0, volume: 1, passes: 2})
  }

  async populateInfo() {
    if(this.__info) return
    try {
      const songInfo = await ytdl.getInfo(this.songID)
      this.__info = {
        songInfo: {
          title: songInfo.title,
          uploader: songInfo.author.name,
          uploader_link: songInfo.author.channel_url,
          uploader_avatar: songInfo.author.avatar,
          thumbnail: songInfo.thumbnail_url,
          length_seconds: songInfo.length_seconds,
          length: this.secondsToHms(songInfo.length_seconds),
          rating: parseFloat(songInfo.avg_rating).toFixed(2),
          views: songInfo.view_count
        },
        videoInfo: {
          id: this.songID
        }
      }
      if(this.message) {
        this.message.delete()
      }
    } catch(e) {
      console.log(e)
      return -1
    }
  }

  async info() {
    if(!this.__info) await this.populateInfo()
    const info = this.__info.songInfo
    const songEmbed = {
      color: 16711680,
      url: this.songUrl,
      thumbnail: {
        url: info.uploader_avatar
      },
      footer: {
        icon_url: this.author.avatarURL,
        text: `Linked by: ${this.author.username} (http://youtube.com/watch?=${this.songID})`
      },
      author: {
        name: info.title
      },
      fields: [
        {
          name: "Uploader: ",
          value: `[${info.uploader}](${info.uploader_link})`
        }, {
          name: "Ratings: ",
          value: `${info.rating} out of 5`
        }, {
          name: "Views: ",
          value: info.views
        }, {
          name: "Length: ",
          value: `${info.length} (${info.length_seconds}s)`
        }
      ]
    }

    return songEmbed
  }
}

module.exports = Song
