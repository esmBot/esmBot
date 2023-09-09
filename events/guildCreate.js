import { log } from "../utils/logger.js";

// run when the bot is added to a guild
export default async (_client, guild) => {
  log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot.`);
};
