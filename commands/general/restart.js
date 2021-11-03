import Command from "../../classes/command.js";

class RestartCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.message.author.id)) return "Only the bot owner can restart me!";
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