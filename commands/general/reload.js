const handler = require("../../utils/handler.js");
const collections = require("../../utils/collections.js");
const Command = require("../../classes/command.js");

class ReloadCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can reload commands!`;
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide a command to reload!`;
    try {
      await handler.unload(this.args[0]);
      await handler.load(collections.paths.get(this.args[0]));
      return `${this.message.author.mention}, the command \`${this.args[0]}\` has been reloaded.`;
    } catch (error) {
      if (error) throw error;
    }
  }

  static description = "Reloads a command";
  static arguments = ["[command]"];
}

module.exports = ReloadCommand;