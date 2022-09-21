import { log } from "../utils/logger.js";

// run when the bot is removed from a guild
export default async (client, guild) => {
  log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);
};
