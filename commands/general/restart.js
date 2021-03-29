const handler = require("../../utils/handler.js");
const collections = require("../../utils/collections.js");
const Command = require("../../classes/command.js");

class RestartCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can restart me!`;
    await this.message.channel.createMessage(`${this.message.author.mention}, esmBot is restarting.`);
    for (const command of collections.commands) {
      await handler.unload(command);
    }
    process.exit(1);
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
}

module.exports = RestartCommand;