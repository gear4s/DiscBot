// List of permissions
exports.PERMISSION = Object.freeze({
  OWNER: 1 << 0,
  ADMIN: 1 << 1,
  MODERATOR: 1 << 2,
  MUTED: 1 << 3,
  DEVELOPMENT: 1 << 4,

  // user-based enum
  IGNORE: 1 << 5,
  NOLIMIT: 1 << 6
})

exports.PERM_ERROR = Object.freeze({
  NO_OWNER: 1,
  NO_ADMIN: 2,
  NO_MOD_ADMIN: 3,
  MUTED: 4,
  IGNORE: 5
})

// Message Type affect sub commands too
exports.MSG_TYPE = Object.freeze({
  DM: 1 << 0,
  CHAN: 1 << 1
})

/*
 * Confirms permissions are proper
 * Arguments:
 * - msg: argument from client.on("message")
 * - permissionBits: permissions set in module.add(nameString, permissionBits, callbackFunction, helpString, usageString)
 */
exports.confirm = (msg, permissionBits) => {
  if(msg.channel.type == "dm") return exports.PERM_ERROR.NOLIMIT // no channels to find permissions for

  permissionBits = exports.PERMISSION[permissionBits]

  // Owner permissions
  if((permissionBits & exports.PERMISSION.OWNER || permissionBits & exports.PERMISSION.DEVELOPMENT) && msg.guild.id != "315882692409425930" && msg.author.id != "232191905394327562") return exports.PERM_ERROR.NO_OWNER

  // Admin or Moderator only commands
  if((permissionBits & exports.PERMISSION.ADMIN || permissionBits & exports.PERMISSION.MODERATOR) && !msg.member.roles.some((r) => ["Admin", "Moderator"].includes(r.name))) return exports.PERM_ERROR.NO_MOD_ADMIN

  // Admin only commands
  if((permissionBits & exports.PERMISSION.ADMIN) && msg.member.roles.some((r) => r.name != "Admin")) return exports.PERM_ERROR.NO_ADMIN

  // If a command has been muted, or the user is being ignored by the bot
  if(permissionBits & exports.PERMISSION.MUTED) return exports.PERM_ERROR.MUTED // To be implemented
  if(permissionBits & exports.PERMISSION.IGNORE) return exports.PERM_ERROR.IGNORE // To be implemented

  // No limits on command
  if(permissionBits & exports.PERMISSION.NOLIMIT) return exports.PERM_ERROR.NOLIMIT
}

exports.confirmChannel = (msg, msgType) => {
  if(msgType & exports.MSG_TYPE.DM && msgType & exports.MSG_TYPE.CHAN)  return true
  if(msgType & exports.MSG_TYPE.DM && msg.channel.type !== "dm")    return false
  if(msgType & exports.MSG_TYPE.CHAN && msg.channel.type !== "text") {
    if(msg.channel.type === "dm") msg.reply("That needs to be used in a channel")
    return false
  }
  return true
}