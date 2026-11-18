import Command from "#cmd-classes/command.js";
import { exit } from "#utils/misc.js";
import { getEnv } from "#utils/runtime.js";

class RestartCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.restart.owner");
    }
    return this.getString("commands.responses.restart.restarting");
  }

  async finalize() {
    if (this.success) await exit(this.client, this.database);
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
  static adminOnly = true;
}

export default RestartCommand;
