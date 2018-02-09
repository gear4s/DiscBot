const Discord = require('discord.js');
const bot     = new Discord.Client();


bot.settings  = require('./settings.json');
const botname = bot.settings.botname;
const prefix  = bot.settings.prefix;

// Categories
norm  = `${prefix}choose <question> - Answers yes or no.\n` +
        `${prefix}roll <number> - Roll a random number. Defaults to 100.\n` +
        `${prefix}help - Shows the help information.`;

music = `${prefix}play <youtube link> - Connects and plays a song that you link.\n` +
        `${prefix}playing - Lists information about the currently playing song.\n` +
        `${prefix}playlist <youtube link/playlist> - Connects and plays an entire playlist.\n` +
        `${prefix}skip - Skips or stops the music bot, depending on the queue.\n` +
        `${prefix}stop - Stops the current song and all songs queued from playing.`;

osu   = `${prefix}beatmap <beatmap link> - Show's specifics about the beatmap you link.\n` +
        `${prefix}osu <username> - Show's linked users profile statistics\n` +
        `${prefix}recent <username> - Show's the last played song by the player`;

wf    = `${prefix}baro - Countdown to Baro's arrival or show's current stock and ETA to leave.\n` +
        `${prefix}cetus - Show's the currently time cycle and time remaining in Cetus.\n` +
        `${prefix}sortie - Show's the current sortie and time remaining.\n` +
        `${prefix}item <item> - Show's the specified item.\n` +
        `${prefix}plat <amount> - Returns the amount of trade tax for the entered platinum.`;

admin = `${prefix}clear - Clears as much as possible.\n` +
        `${prefix}purge <1-100> - Clears the specified amount of messages.\n` +
        `${prefix}blacklist <@user> - Blacklists a user from using bot commands.\n` +
        `${prefix}unblacklist <@user> - Unblacklists a user from using bot commands.\n` +
        `${prefix}resetblacklist - Completely resets the blacklisting.\n` +
        `${prefix}blackstatus <@user> - Checks if user is blacklisted and returns status.\n` +
        `${prefix}status <status> - Changes the game the bot is playing.` + 
        `${prefix}admins - Lists all admins on the server.`;

const help = new Discord.RichEmbed()
      .setAuthor(`${botname}'s Help Menu`)
      .setColor(`#063cff`)
      .setDescription(`Page 1 of ${botname}'s commands.`)
      .addField(`General: `, norm)
      .addField(`Music: `, music)
      .addField(`Osu: `, osu)
      .addField(`Warframe: `, wf);

const help2 = new Discord.RichEmbed()
      .setAuthor(`${botname}'s Help Menu`)
      .setColor(`#063cff`)
      .setDescription(`Page 2 of ${botname}'s commands.`)
      .addField(`Admin: `, admin);

const emptyQueue = new Discord.RichEmbed()
      .setColor("#063cff")
      .setDescription(`:musical_note: Music queue is empty, I've disconnected until more songs are added.`);
  
const addedQueue = new Discord.RichEmbed()
      .setColor("#063cff")
      .setDescription(`:musical_note: Song added, please wait while it loads.`);
  
const stoppedQueue = new Discord.RichEmbed()
      .setColor("#063cff")
      .setDescription(`:musical_note: All songs have been successfully stopped.`);
  
const skippedQueue = new Discord.RichEmbed()
      .setColor("#063cff")
      .setDescription(`:musical_note: Song has been skipped successfully.`);
  
const addedPlaylist = new Discord.RichEmbed()
      .setColor("#063cff") 
      .setDescription(`:musical_note: Playlist has been successfully added.`);

module.exports.help          = help;
module.exports.help2         = help2;
module.exports.emptyQueue    = emptyQueue;
module.exports.addedQueue    = addedQueue;
module.exports.stoppedQueue  = stoppedQueue;
module.exports.skippedQueue  = skippedQueue;
module.exports.addedPlaylist = addedPlaylist;