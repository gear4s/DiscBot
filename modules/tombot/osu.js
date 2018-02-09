const {deleteMessage} = require(`${__dirname}/inc/func.js`)
const Discord = require("discord.js")
const osu = require(`node-osu`);
const osuApi  = new osu.Api("b689c0f405b67e003932e85fb025b798a706a5a0", {
    notFoundAsError: true,
    completeScores: false
});

function secondsToHms(number) {
    number = Number(number);
    var h = Math.floor(number / 3600);
    var m = Math.floor(number % 3600 / 60);
    var s = Math.floor(number % 3600 % 60);
    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}

const cmdBeatmap = async info => {
  if (!info.args[0]) {
    return info.msg.reply(`Please include a valid beatmap link.`);
  }

  var link = info.args[0];
  var id = link;
  var id = id.substring(id.indexOf("/b/") + 2);
  var id = id.substring(id.indexOf("/s/") + 2);

  if(id.indexOf("&") > -1) id = id.substring(0, id.indexOf('&'));
  if(id.indexOf("?") > -1) id = id.substring(0, id.indexOf('?'));

  const beatmaps = await osuApi.getBeatmaps({b: id}).catch(console.log);
  var title = beatmaps[0].title;
  var creator = beatmaps[0].creator;
  var version = beatmaps[0].version;
  var artist  = beatmaps[0].artist;
  var bpm     = beatmaps[0].bpm;
  var mode    = beatmaps[0].mode;
  var approval = beatmaps[0].approvalStatus;
  var combo   = beatmaps[0].maxCombo;
  var rating = beatmaps[0].difficulty.rating;
  var rating = parseFloat(rating).toFixed(2);
  var ar = beatmaps[0].difficulty.approach;
  var plays = beatmaps[0].counts.plays;
  var length = beatmaps[0].time.total;
  var length = secondsToHms(length);
  var thumbnail = 'https://i.imgur.com/Bco94zS.png';

  let beatmapEmbed = new Discord.RichEmbed()
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
    
  info.msg.channel.send(beatmapEmbed);
}

const cmdOsu = async info => {
  if (!info.args[0]) {
    return info.msg.reply("This command requires a user profile link.");
  }

  var link = info.args[0];
  var id = link;
  if(/^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(link)) {
    var id = id.substring(id.indexOf("/u/") + 3);

    if(id.indexOf("&") > -1) id = id.substring(0, id.indexOf('&'));
    if(id.indexOf("?") > -1) id = id.substring(0, id.indexOf('?'));
  } else link = "https://osu.ppy.sh/u/"+link

  let fail = false
  const getUser = await osuApi.getUser({u: id}).catch(err => {
    if (err == "Error: User not found") {
      fail = true
    }
  })

  if(fail) return info.msg.reply("User not found, make sure you're using a profile link and not a name.")

  var name  = getUser.name;
  var ss    = getUser.counts.SS;
  var s     = getUser.counts.S;
  var a     = getUser.counts.A;
  var plays = getUser.counts.plays;
  var pp    = getUser.pp.raw;
  var rank  = getUser.pp.rank;
  var crank = getUser.pp.countryRank;
  var cntry = getUser.country;
  var level = getUser.level;
  var level = parseFloat(level).toFixed(2);
  var acc   = getUser.accuracyFormatted;
  var thumbnail = 'https://i.imgur.com/Bco94zS.png';

  let userEmbed = new Discord.RichEmbed()
    .setAuthor(`${name}'s OSU Statistics`)
    .setColor("#063cff")
    .addField("Plays: ", plays, true)
    .addField("PP: ", pp, true)
    .addField("Rank: ", rank, true)
    .addField("Country Rank: ", `${crank} in ${cntry}`, true)
    .addField("Level: ", level, true)
    .addField("Accuracy: ", acc, true)
    .setThumbnail(thumbnail)
    .setURL(link)
    .setFooter(`Linked by: ${info.msg.author.username} (${link})`, info.msg.author.avatarURL)
    
    info.msg.channel.send(userEmbed);
}

const cmdRecent = async info => {
  if (!info.args[0]) {
    return info.msg.reply("Include a username, retard.");
  }

  var name = info.args[0];
  const getUserRecent = await osuApi.getUserRecent({u: name}).catch(console.log);
  var scoreObj = getUserRecent[0];
  var score = scoreObj.score;
  var beatmapid = scoreObj.beatmapId;
  var id = scoreObj.user.id;
  var beatmaplink = "https://osu.ppy.sh/b/" + beatmapid;
  var fifty = parseInt(scoreObj.counts['50']);
  var hundred = parseInt(scoreObj.counts['100']);
  var threehundred = parseInt(scoreObj.counts['300']);
  var totalhit = Math.floor(fifty + hundred + threehundred);
  var maxcombo = scoreObj.maxcombo;
  var rank = scoreObj.rank;
  var pp = scoreObj.pp;
  var missed = scoreObj.counts.miss;
  var thumbnail = 'https://i.imgur.com/Bco94zS.png';

  if (pp == null) var pp = "None";

  const getUser2 = await osuApi.getUser({u: id}).catch(console.log);
  var nam = getUser2.name;

  if(nam != name) {
    info.msg.reply("That's not a valid account name!");
  }

  const getBeatmaps = await osuApi.getBeatmaps({b: beatmapid}).catch(console.log);   
  var beatmapname = getBeatmaps[0].title;
  var beatmapversion = getBeatmaps[0].version;
  var beatmapcreator = getBeatmaps[0].creator;
  var beatmapcombo = getBeatmaps[0].maxCombo;
  var beatmapdiff = getBeatmaps[0].difficulty.rating;
  var beatmapdiff = parseFloat(beatmapdiff).toFixed(2);
  var beatmapbpm = getBeatmaps[0].bpm;
  var beatmapmaxcombo = getBeatmaps[0].maxCombo;

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
        
  info.msg.channel.send(recentEmbed);
}

const init = (client, command) => {
  [
    {
      name: "osu",
      permissions: 'NOLIMIT',
      callback: deleteMessage(cmdOsu),
      help: "Get osu! user profile statistics",
      usage: "r:username"
    }, {
      name: "recent",
      permissions: 'ADMIN',
      callback: deleteMessage(cmdRecent),
      help: "Get recent statistics for user",
      usage: "r:username"
    }, {
      name: "beatmap",
      permissions: 'ADMIN',
      callback: deleteMessage(cmdBeatmap),
      help: "Get beatmap information",
      usage: "r:beatmapLink"
    }
  ].forEach(command.subcmd)

  return "osu!"
}

const deinit = async () => {
}

module.exports = {
  init,
  deinit
}
