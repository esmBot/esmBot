import process from "node:process";
import { setTimeout } from "node:timers/promises";
import Command from "#cmd-classes/command.js";
import { exit } from "#utils/misc.js";

class RestartCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.restart.owner");
    }
    try {
      return this.getString("commands.responses.restart.restarting");
    } finally {
      // we can't do it instantly because we need to send the message first
      setTimeout(3000).then(() => exit(this.client, this.database));
    }
  }

  static description = "Restarts me";
  static aliases = ["reboot"];
  static adminOnly = true;
}

export default RestartCommand;
