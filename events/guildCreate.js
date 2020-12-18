const db = require("../utils/database.js");
const logger = require("../utils/logger.js");

// run when the bot is added to a guild
module.exports = async (guild) => {
  logger.log("info", `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
  await db.addGuild(guild);
};
