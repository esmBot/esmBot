const db = require("../utils/database.js");
const logger = require("../utils/logger.js");
const misc = require("../utils/misc.js");
const client = require("../utils/client.js");

// run when the bot is added to a guild
module.exports = async (guild) => {
  logger.log("info", `[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${client.users.get(guild.ownerID).username}#${client.users.get(guild.ownerID).discriminator} (${guild.ownerID})`);
  await db.query("INSERT INTO guilds (guild_id, tags, prefix, warns, disabled) VALUES ($1, $2, $3, $4, $5)", [guild.id, misc.tagDefaults, "&", {}, []]);
};
