const {deleteMessage, settings, momennt, request, Discord} = require(`${__dirname}/inc/func.js`)
const TomBotModule = require(`${__dirname}/inc/tombotcmd.js`)

class TomBotWarframe extends TomBotModule {
  constructor(client) {
    super(client, "Warframe Module")
    this.wfItemList = require("warframe-item-list")
  }

  async cmdPlattax(info) {
    const platinum = parseInt(info.args[0], 0);
    console.log(platinum)
    if(platinum == 0) return info.msg.reply("You need to include a valid platinum amount.")

    const plattax  = 500;
    const tradetax = platinum * plattax;
    info.msg.reply(`:warframe: The trading tax for ${platinum} platinum is ${tradetax} credits.`);
  }

  async cmdItem(info) {
    if (!info.args)         return info.msg.reply("Enter an item.")
    if (info.args.length>3) return info.msg.reply("That dosen't exist.")

    const weapons = bot.warframe.weapons;
    const item = weapons.find(w => w.name == info.args.join(" ").trim())

    const weapon = this.wfItemList.objects[global.itemType].find(i => i.name == global.itemName);
    const weaponCategory = weapon.category | "None";
    const weaponMastery = weapon.masteryRank | 0;
    const warframeEmbed = new Discord.RichEmbed()
          .setAuthor(`Warframe Item Information: ${weapons.name}`)
          .setColor("#063cff")
          .addField("Weapon Type: ", weapon.type, true)
          .addField("Category: ", weaponCategory, true)
          .addField("Weapon Name: ", weapon.name)
          .addField("Mastery Rank: ", weaponMastery, true)
          .addField("Acquisition: ", weapon.acquisition, true)
          .setFooter("Requested by: " + info.msg.author.username, info.msg.author.avatarURL);
      
    info.msg.channel.send(warframeEmbed);
  }

  async cmdSortie(info) {
    const sortie_req = await request(settings.warframe.sortie, {method: "GET"})
    const sortie_json = JSON.parse(sortie_req.body);
    const sortie = {
      modifiers: require(`${__dirname}/assets/json/sortie/sortie-modifiers.json`),
      boss: require(`${__dirname}/assets/json/sortie/sortie-bosses.json`)[sortie_json.Boss],
      activation: sortie_json.Activation.sec,
      expiry: sortie_json.Expiry.sec,
      variants: sortie_json.Variants,
      link: "http://warframe.wikia.com/wiki/Sortie"
    }
    const timedate = Math.round(new Date().getTime() / 1000);
    sortie.time = sortie.expiry - timedate;

    const st = {
      h: Math.round((sortie.time / 3600) % 24),
      m: Math.round((sortie.time / 60) % 60),
      s: Math.round(sortie.time % 60)
    }
    st.h += " hour" + (st.h>1?"s":"")
    st.m += " minute" + (st.m>1?"s":"")
    st.s += " second" + (st.s>1?"s":"")
    const sortieEmbed = new Discord.RichEmbed()
          .setAuthor(`[PC] ${sortie.boss} - Sortie`)
          .setColor("#063cff")
          .setThumbnail(settings.warframe.color)
          .setURL(sortie.link)
          .setDescription(`${st.h}, ${st.m}, ${st.s} remaining.`)
          .setFooter("Requested by " + info.msg.author.username, info.msg.author.avatarURL);

    for (const mission of sortie_json.Variants) {
      const [missionType, modifierType, node] = [mission.missionType, sortie.modifiers[mission.modifierType], mission.node]
      sortieEmbed.addField(`${missionType=="MT_EVACUATION"?"Evacuation":missionType} - ${node}`, `${modifierType}`);
    }

    info.msg.channel.send(sortieEmbed);
  }

  formatCetus(time) {
      var hours = Math.floor(time / 3600);
      var minutes = Math.ceil((time - (hours * 3600)) / 60);
      var ret = '';
      if (hours > 0)
          ret = hours + 'h ';
      ret += minutes + 'm';
      return ret;
  }

  async cmdCetus(info, client) {
    const cetus_req = await request(settings.warframe.syndicate, {method: "GET"}).catch(console.log);
    const cetus_json = JSON.parse(cetus_req.body);

    const cetus      = cetus_json.find(i => i.Tag == "CetusSyndicate"),
          activation = cetus.Activation.sec * 1000 + cetus.Activation.usec,
          expiry     = cetus.Expiry.sec * 1000 + cetus.Expiry.usec,
          now        = moment().valueOf();

      
    if (now > activation && now < expiry) {
      const timeSinceDusk = now - activation;
      cetus.cycle = (timeSinceDusk<100*60*1000)?'Day':'Night'
      cetus.timeLeft = this.formatCetus(((cetus.cycle=='Day'?100:150) * 60 * 1000 - timeSinceDusk) / 1000);
    }

    if(!client.emojis.find("name", "warframe")) info.msg.guild.createEmoji(`${__dirname}/${settings.warframe.emoji}`, "warframe");

    info.msg.channel.send(`:warframe: It's currently ${cetus.cycle} in Cetus, but it ends in ${cetus.timeLeft}`)
  }

  retFormat(v) {
    const t = {
      d: Math.round(v / 86400),
      h: Math.round((v / 3600) % 24),
      m: Math.round((v / 60) % 60),
      s: Math.round(v % 60)
    }

    t.d += " day"    + (t.h>1?"s":"") + ", "
    t.h += " hour"   + (t.h>1?"s":"") + ", "
    t.m += " minute" + (t.m>1?"s":"") + ", "
    t.s += " second" + (t.s>1?"s":"") + ", "

    return t
  }
  async cmdBaro(info) {
    const baro_req = await request(settings.warframe.baro, {method: "GET"}).catch(console.log)
    const baro_json = JSON.parse(baro_req.body)[0]
    const baro = {
      timedate   : Math.round(new Date().getTime() / 1000),
      activation : baro_json.Activation.sec,
      expiry     : baro_json.Expiry.sec,
      character  : "Baro Ki'Teer",
      location   : baro_json.Node,
      manifest   : baro_json.manifest
    }

    if (baro.timedate >= baro.expiry) {
      const texpiry = Math.round(baro.expiry - baro.timedate) % 60

      if(texpiry >= 0) {
        const t = this.retFormat(baro.expiry - baro.timedate)
        const leave_eta = (t.h + t.m + t.s).replace("-", " ")
        info.msg.reply(`${baro.character} left ${baro.leave_eta} ago.`)
        return
      }
    }

    if(baro.timedate >= baro.activation){
        var inventory = ""
        var link      = "http://warframe.wikia.com/wiki/Baro_Ki'Teer"
        const t = this.retFormat(baro.expiry - baro.timedate)
        const baroEmbed = new Discord.RichEmbed()
              .setAuthor(`[PC] ${baro.character} - Void Trader`)
              .setColor("#063cff")
              .setThumbnail(settings.warframe.icon)
              .setURL(link)
              .setFooter(`Requested by ${info.msg.author.username}`, info.msg.author.avatarURL)

        let itemnum = 0
        for(const item of baro.manifest) {
            const [ItemType, PrimePrice] = [item.ItemType, item.PrimePrice]
            const ItemPrice  = item.RegularPrice.toLocaleString()
            baroEmbed.addField(`Item \#${ItemType}`, `${PrimePrice} ducats, ${ItemPrice} credits.`, true)
            itemnum++
        }

        baroEmbed.addField(`${baro.character} is at ${baro.location}`, `Leaving in ${t.d + t.h + t.m + t.s}`)
        info.msg.channel.send(baroEmbed)
        return
    }

    const t = this.retFormat(baro.activation - baro.timedate)
    info.msg.reply(`${baro.character} arrives in ${t.d + t.h + t.m + t.s} at ${baro.location}`)
  }

  init(command) {
    [
      {
        name: "plattax",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdPlattax),
        help: "Return the credit tax for trading a number of platinum",
        usage: "r:platinum"
      }, {
        name: "item",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdItem),
        help: "Get information of a certain item",
        usage: "r:itemName"
      }, {
        name: "sortie",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdSortie),
        help: "Get time until sorties are assigned (required level 30 and War Within complete)",
      }, {
        name: "cetus",
        permissions: 'ADMIN',
        callback: deleteMessage(function(i) {this.cmdCetus(i, client)}.bind(this)),
        help: "Get Cetus' current cycle, and when it ends",
      }, {
        name: "baro",
        permissions: 'ADMIN',
        callback: deleteMessage(this.cmdBaro),
        help: "Get information on Baro",
      }
    ].forEach(command.subcmd)
  }
}

module.exports = TomBotWarframe