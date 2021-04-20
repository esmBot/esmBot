const db = require("../utils/database");
const logger = require("../utils/logger");

// run when the bot is added to a guild
module.exports = async (client, guild) => {
  logger.log("info", `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
  await db.addGuild(guild);
};
