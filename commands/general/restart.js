import Command from "../../classes/command.js";

class RestartCommand extends Command {
  // eh, screw it
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.author.id)) {
        this.success = false;
        resolve("Only the bot owner can restart me!");
        return;
      }
      resolve("esmBot is restarting.");
      process.exit(1);
    });
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
  static adminOnly = true;
}

export default RestartCommand;