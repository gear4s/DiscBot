'use strict';
const con = require(`${global.rootpath}/lib/consoleops.js`)

con.configure({
  using: {
    log: 'module.groupfinder.wow.log',
    debug: 'module.groupfinder.wow.debug',
    error: 'module.groupfinder.wow.error'
  },
  categories: {
    ['module.groupfinder.wow.log']: {
      appenders: ['server', 'console', 'log'],
      level: 'trace'
    },
    ['module.groupfinder.wow.debug']: {
      appenders: ['server', 'console', 'debug'],
      level: 'debug'
    },
    ['module.groupfinder.wow.error']: {
      appenders: ['server', 'console', 'error'],
      level: 'error'
    },
    default: {
      appenders: ['server', 'console'],
      level: 'trace'
    }
  }
})

let WoW = []

const clone = require("clone")
const blizzard = require("blizzard.js").initialize({ apikey: process.env.BNET_API })
const blizzinfo = {}

const [Enmap, EnmapLevel] = [require("enmap"), require('enmap-level')]

const mod = {}
const db = {players: [], dungeons: []}

mod.dungeon = (msg, dungeonDifficulty, playersRequired) => {
  const dungeonInstance = {
    dungeonDifficulty,
    playersRequired,
    owner: msg.author
  }
  WoW.push(dungeonInstance)
}

mod.lookingForGroup = (info) => {
  // Looking for group

  // checking args are correct
  if(!args[0]) return info.msg.reply("you need to specify a character to play with, in the form of characterName/preferredRole (e.g. Nasou/DPS)")
  if(!args[1]) return info.msg.reply("you need to request for dungeon, pvp or raid")
  if(!args[2]) return info.msg.reply(`you need to choose ${args[1] === 'pvp' ? "if you want 2v2, 3v3, or RBG" : "a difficulty"}`)
  if(!args[3]) return info.msg.reply("you need to specify how many players you still need")
  
  // parsing if dungeon, raid or pvp
  switch(args[0]) {
    case "dungeon": {
      mod.dungeon(info.msg, args[1], args[2])
    }; break;
    default:
      info.msg.reply(`${args[1]} is an invalid choice`)
  }
}

mod.registerCharacter = async (info) => {
  try {
    const [playerName, playerRegion, playerRealm] = info.args
    
    if(!playerName || !playerRegion || !playerRealm)
      return info.msg.reply("please make sure your character's name, region and realm is present!")

    const char = (await blizzard.wow.character(['profile'], { origin: playerRegion, realm: playerRealm, name: playerName })).data

    const confirmedChars = db.players.get("player-list")
    const unconfirmedChars = db.players.get("player-list-unconfirmed")

    const check = char =>  char && char.region == playerRegion && char.realm == playerRealm && char.name == playerName
    if(confirmedChars.find(check)) return info.msg.reply("that character has already been confirmed and may no longer be registered!")
    if(unconfirmedChars.find(char => check(char) && char.discordId == info.msg.author.id)) return info.msg.reply("you have already registered that character and it is awaiting confirmation!")
    unconfirmedChars.push({
      name: char.name,
      region: playerRegion,
      realm: char.realm,
      class: char.class,
      race: char.race,
      gender: char.gender,
      level: char.level,
      faction: char.faction,
      discordId: info.msg.author.id,
      confirmed: false
    })

    db.players.set("player-list-unconfirmed", unconfirmedChars)
    info.msg.reply(
      `please confirm that ${char.name}-${char.realm} (${playerRegion}) is your character, by\n`+
      "- Unequipping the *Feet* and the *Chest* items\n"+
      "- Logging out\n"+
      "- Using **\"!wow confirm\"** in this discord channel"
    )
  } catch(e) {
    con.debug(e)
    info.msg.reply("that character does not exist!")
  }
}

mod.confirmCharacters = async (info) => {
  try {
    const charListUnconfirmed = db.players.get("player-list-unconfirmed")
    const charList = db.players.get('player-list')
    const control = charListUnconfirmed.filter(char => char && char.discordId === info.msg.author.id && !char.confirmed)
    if(control.length === 0) return info.msg.reply("you have no unconfirmed characters registered.")

    let errors = []
    for(const char of control) {
      const bchar = (await blizzard.wow.character(['profile', 'items'], { origin: char.region, realm: char.realm, name: char.name })).data
      if(!bchar.items.feet && !bchar.items.chest) {
        let uccDelete = ichar => char && char.region == ichar.region && char.realm == ichar.realm && char.name == ichar.name
        // copy character
        const internalChar = clone(char)

        // delete char from charListUnconfirmed
        uccDelete = charListUnconfirmed.map((x, i) => uccDelete(x) ? i : null).filter(x => x !== null)
        for(const char of uccDelete) {
          delete charListUnconfirmed[char]
        }

        internalChar.confirmed = true
        charList.push(internalChar)
      } else errors.push(`${char.name} needs to have h${char.gender ? 'er' : 'is'} ${bchar.items.feet ? 'feet ' : ''}${bchar.items.feet && bchar.items.chest ? 'and ' : ''}${bchar.items.chest ? 'chest ' : ''}items removed`)
    }
    db.players.set("player-list-unconfirmed", charListUnconfirmed)
    db.players.set("player-list", charList)

    info.msg.reply(errors.length > 0 ? errors.join("\n") : "we have successfully confirmed your characters!")
  } catch(e) {
    con.debug("Error processing character: \n", e)
    info.msg.reply("there was an error processing your characters.")
  }
}

mod.listOfRegisteredCharacters = (info) => {
  const fields = []
  const [confirmed, unconfirmed] = [db.players.get('player-list').filter(char => char && char.discordId === info.msg.author.id), db.players.get('player-list-unconfirmed').filter(char => char && char.discordId === info.msg.author.id)]
  const allChars = confirmed.concat(unconfirmed)

  for(const char of allChars) {
    fields.push({
      name: `${char.name}-${char.realm} (${char.region.toUpperCase()})`,
      value: `*Faction:* ${blizzinfo.races.find(race => race.id == char.race).side}\n*Status:* ${char.confirmed ? '✓ ' : '❌ un'}confirmed`
    })
  }
  info.msg.channel.send({embed: {
    title: `List of characters for @${info.msg.author.tag}`,
    fields: fields
  }})
}

mod.init = async (client, gameList) => {
  try {
    const __players = new EnmapLevel({ name: 'wowPlayers' })
    db.players = new Enmap({ provider: __players })
    const __dungeons = new EnmapLevel({ name: 'wowDungeons' })
    db.dungeons = new Enmap({ provider: __dungeons })

    await db.players.defer
    // all data is loaded now.
    // if DB is being run for first time then create some basic arrays to contain information
    if(!db.players.get("player-list-unconfirmed")) db.players.set("player-list-unconfirmed", [])
    if(!db.players.get("player-list")) db.players.set("player-list", [])
    if(!db.dungeons.get("list")) db.dungeons.set("list'", [])

    con.debug("Module GroupFinder-WoW:")
    db.players.forEach((c, key) => con.debug(`- Loaded ENMap key ${key}`)) 
  } catch(e) {
    con.error("WoW database initialize error! Module loading cancelled.")
    return
  }

  WoW = gameList

  blizzinfo.classes = (await blizzard.wow.data("character-classes")).data.classes
  blizzinfo.races = (await blizzard.wow.data("character-races")).data.races

  const wowCommand = client.commands.add({
    name: "wow",
    msgType: 'DM',
    permissions: 'NO_LIMIT',
    help: "WoW module",
    usage: "r:subcommand;o:...args"
  });

  [
    {
      name: "register",
      permissions: 'NO_LIMIT',
      callback: mod.registerCharacter,
      help: "Register your WoW character to your Discord account",
      usage: "r:charName,charRegion,charRealm"
    }, {
      name: "confirm",
      permissions: 'NO_LIMIT',
      callback: mod.confirmCharacters,
      help: "Confirms your WoW characters that you've registered and are still pending confirmation"
    }, {
      name: "list",
      permissions: 'NO_LIMIT',
      callback: mod.listOfRegisteredCharacters,
      help: "Lists your registered WoW characters"
    },
    {
      name: "dungeon",
      permissions: 'NO_LIMIT',
      callback: mod.lookingForGroup,
      help: "help for this command"
    }
  ].forEach(wowCommand.subcmd)

  return "World of Warcraft"
}

mod.deinit = async () => {
  // close databases
  await db.players.db.close()
  await db.players.db.close()
}

module.exports = {
  init: mod.init,
  deinit: mod.deinit,
}
