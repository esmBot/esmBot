const handler = require("../utils/handler.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can reload commands!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide a command to reload!`;
  try {
    await handler.unload(args[0]);
    await handler.load(args[0]);
    return `${message.author.mention}, the command \`${args[0]}\` has been reloaded.`;
  } catch (error) {
    if (error) throw error;
  }
};

exports.category = 8;
exports.help = "Reloads a command";
exports.params = "[command]";