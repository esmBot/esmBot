import type { Client, Guild } from "oceanic.js";
import { info } from "../utils/logger.js";

// run when the bot is added to a guild
export default async (_client: Client, guild: Guild) => {
  info(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
};
