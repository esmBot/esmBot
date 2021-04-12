const logger = require("../utils/logger.js");

// run when the bot is removed from a guild
module.exports = async (client, guild) => {
  logger.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);
};
