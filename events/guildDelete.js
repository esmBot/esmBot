const database = require("../utils/database.js");
const logger = require("../utils/logger.js");

// run when the bot is removed from a guild
module.exports = async (guild) => {
  logger.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);
  database.settings.delete(guild.id);
  database.tags.delete(guild.id);
};
