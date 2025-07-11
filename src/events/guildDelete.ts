import type { Guild, Uncached } from "oceanic.js";
import { info } from "#utils/logger.js";
import type { EventParams } from "#utils/types.js";

// run when the bot is removed from a guild
export default (_: EventParams, guild: Guild | Uncached) => {
  const name = "name" in guild ? `${guild.name} (${guild.id})` : guild.id;
  info(`[GUILD LEAVE] ${name} removed the bot.`);
};
