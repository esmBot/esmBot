import Command from "../../classes/command.js";

class RestartCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can restart me!";
    }
    await this.client.createMessage(this.channel.id, Object.assign({
      content: "esmBot is restarting."
    }, this.reference));
    process.exit(1);
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
  static adminOnly = true;
}

export default RestartCommand;