import Command from "../../classes/command.js";

class RestartCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return "Only the bot owner can restart me!";
    await this.client.createMessage(this.message.channel.id, Object.assign({
      content: "esmBot is restarting."
    }, this.reference));
    this.ipc.restartAllClusters(true);
    //this.ipc.broadcast("restart");
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
}

export default RestartCommand;