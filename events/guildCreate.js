import db from "../utils/database.js";
import { log } from "../utils/logger.js";

// run when the bot is added to a guild
export default async (client, cluster, worker, ipc, guild) => {
  log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
  const guildDB = await db.getGuild(guild.id);
  if (!guildDB) await db.addGuild(guild);
};
