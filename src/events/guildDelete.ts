import type { Client, Guild, Uncached } from "oceanic.js";
import { info } from "../utils/logger.js";
import type { DatabasePlugin } from "../database.js";

// run when the bot is removed from a guild
export default async (_client: Client, _db: DatabasePlugin | undefined, guild: Guild | Uncached) => {
  const name = "name" in guild ? `${guild.name} (${guild.id})` : guild.id;
  info(`[GUILD LEAVE] ${name} removed the bot.`);
};
