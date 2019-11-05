const db = require("../utils/database.js");
const logger = require("../utils/logger.js");
const misc = require("../utils/misc.js");
const client = require("../utils/client.js");

// run when the bot is added to a guild
module.exports = async (guild) => {
  logger.log("info", `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${client.users.get(guild.ownerID).username}#${client.users.get(guild.ownerID).discriminator} (${guild.ownerID})`);
  const guildDB = new db.guilds({
    id: guild.id,
    tags: misc.tagDefaults,
    prefix: "&"
  });
  const memberInfo = {};
  for (const member of guild.members) {
    memberInfo[member.id] = {
      xpAmount: 0,
      level: 0
    };
  }
  const xpDB = new db.xp({
    id: guild.id,
    members: memberInfo,
    enabled: false
  });
  await guildDB.save();
  await xpDB.save();
};
