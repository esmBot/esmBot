const handler = require("../utils/handler.js");
const collections = require("../utils/collections.js");

exports.run = async (message) => {
  if (message.author.id !== require("../config.json").botOwner) return `${message.author.mention}, only the bot owner can restart me!`;
  await message.channel.createMessage(`${message.author.mention}, esmBot is restarting.`);
  collections.commands.forEach(async (command) => {
    await handler.unload(command);
  });
  process.exit(1);
};

exports.aliases = ["reboot"];