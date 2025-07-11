import type { Guild } from "oceanic.js";
import { info } from "#utils/logger.js";
import type { EventParams } from "#utils/types.js";

// run when the bot is added to a guild
export default (_: EventParams, guild: Guild) => {
  info(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
};
