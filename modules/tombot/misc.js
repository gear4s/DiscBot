const {deleteMessage} = require(`${__dirname}/inc/func.js`)
const cmdRoll = async info => {
  var rollnumber = parseInt(info.args[0], 100)
  info.msg.reply("You rolled: " + Math.floor(Math.random() * rollnumber));
}

const cmdChoose = async info => {
  if(!info.args[0]) return message.reply("You need to include a question.")

  const answerTable = [
    "Yeah", "Nah", "Maybe",
    "If you say so"
  ];

  let answerEmbed = new Discord.RichEmbed()
    .setAuthor(`${botname}'s Question Results`)
    .setColor("#063cff")
    .addField("Question: ", info.args.join(" "))
    .addField("Answer: ", answerTable[Math.floor(Math.random() * answerTable.length)])
    .setFooter("Requested by: " + message.author.username, message.author.avatarURL)

  deleteMessage(info.msg);
  message.channel.send(answerEmbed);      
}

const init = (client, command) => {
  [
    {
      name: "roll",
      permissions: 'ADMIN',
      callback: deleteMessage(cmdRoll),
      help: "Roll a number!",
      usage: "o:number"
    }, {
      name: "choose",
      permissions: 'ADMIN',
      callback: deleteMessage(cmdChoose),
      help: "Get an answer for your question!",
      usage: "r:question"
    }
  ].forEach(command.subcmd)

  return "Misc"
}

const deinit = async () => {
}

module.exports = {
  init,
  deinit
}
