const handler = require("../utils/handler.js");
const collections = require("../utils/collections.js");

exports.run = async (message) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can restart me!`;
  await message.channel.createMessage(`${message.author.mention}, esmBot is restarting.`);
  for (const command of collections.commands) {
    await handler.unload(command);
  }
  process.exit(1);
};

exports.aliases = ["reboot"];
exports.category = 8;
exports.help = "Restarts me";