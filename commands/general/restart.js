import Command from "../../classes/command.js";

class RestartCommand extends Command {
  // eh, screw it
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.author.id)) {
        this.success = false;
        resolve(this.getString("commands.responses.restart.owner"));
        return;
      }
      resolve(this.getString("commands.responses.restart.restarting"));
      process.exit(1);
    });
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
  static adminOnly = true;
}

export default RestartCommand;