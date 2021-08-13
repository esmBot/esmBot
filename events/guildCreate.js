const db = require("../utils/database.js");
const logger = require("../utils/logger.js");

// run when the bot is added to a guild
module.exports = async (client, cluster, worker, ipc, guild) => {
  logger.log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
  const guildDB = await db.getGuild(guild.id);
  if (!guildDB) await db.addGuild(guild);
};
