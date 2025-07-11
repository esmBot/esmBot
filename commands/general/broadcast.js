import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { endBroadcast, startBroadcast } from "#utils/misc.js";

class BroadcastCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.broadcast.owner");
    }
    const message = this.getOptionString("message") ?? this.args.join(" ");
    if (message?.trim()) {
      await this.database?.setBroadcast(message);
      startBroadcast(this.client, message);
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "broadcastStart",
            from: process.env.pm_id,
            message,
          },
        });
      }
      return this.getString("commands.responses.broadcast.started");
    }
    await this.database?.setBroadcast();
    endBroadcast(this.client);
    if (process.env.PM2_USAGE) {
      process.send?.({
        type: "process:msg",
        data: {
          type: "broadcastEnd",
          from: process.env.pm_id,
        },
      });
    }
    return this.getString("commands.responses.broadcast.ended");
  }

  static flags = [
    {
      name: "message",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The message to broadcast",
    },
  ];

  static description = "Broadcasts a playing message until the command is run again or the bot restarts";
  static adminOnly = true;
  static dbRequired = true;
}

export default BroadcastCommand;
