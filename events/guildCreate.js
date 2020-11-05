const db = require("../utils/database.js");
const logger = require("../utils/logger.js");
const misc = require("../utils/misc.js");

// run when the bot is added to a guild
module.exports = async (guild) => {
  logger.log("info", `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
  const guildDB = new db.guilds({
    id: guild.id,
    tags: misc.tagDefaults,
    prefix: process.env.PREFIX,
    warns: {},
    disabledChannels: [],
    tagsDisabled: false
  });
  await guildDB.save();
  return guildDB;
};
