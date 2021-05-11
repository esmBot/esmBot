const handler = require("../../utils/handler.js");
const collections = require("../../utils/collections.js");
const Command = require("../../classes/command.js");

class RestartCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return "Only the bot owner can restart me!";
    await this.client.createMessage(this.message.channel.id, Object.assign({
      content: "esmBot is restarting."
    }, this.reference));
    for (const command of collections.commands) {
      await handler.unload(command);
    }
    this.ipc.broadcast("restart");
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
}

module.exports = RestartCommand;