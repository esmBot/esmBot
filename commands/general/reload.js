const handler = require("../../utils/handler");
const collections = require("../../utils/collections");
const Command = require("../../classes/command");

class ReloadCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can reload commands!`;
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide a command to reload!`;
    const result = await handler.unload(this.args[0]);
    if (result) return result;
    const result2 = await handler.load(collections.paths.get(this.args[0]));
    if (result2) return result2;
    return `${this.message.author.mention}, the command \`${this.args[0]}\` has been reloaded.`;
  }

  static description = "Reloads a command";
  static arguments = ["[command]"];
}

module.exports = ReloadCommand;