const settings = require(`${__dirname}/../assets/settings.json`)
const deleteMessage = cb => {
  return async info => {
    if(settings.shouldDeleteMessages) await info.msg.delete().catch(console.log)
    cb(info)
  }
}

const request = require('async-request')
const Discord = require('discord.js')
const moment  = require('moment')

module.exports = {
  deleteMessage,moment,request,Discord,settings
}
