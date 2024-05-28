import Command from "../../classes/command.js";
import database from "../../utils/database.js";
import { endBroadcast, startBroadcast } from "../../utils/misc.js";

class BroadcastCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can broadcast messages!";
    }
    const message = this.options.message ?? this.args.join(" ");
    if (message?.trim()) {
      await database.setBroadcast(message);
      startBroadcast(this.client, message);
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "broadcastStart",
            message
          }
        });
      }
      return "Started broadcast.";
    } else {
      await database.setBroadcast(null);
      endBroadcast(this.client);
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "broadcastEnd"
          }
        });
      }
      return "Ended broadcast.";
    }
  }

  static flags = [{
    name: "message",
    type: 3,
    description: "The message to broadcast"
  }];

  static description = "Broadcasts a playing message until the command is run again or the bot restarts";
  static adminOnly = true;
  static dbRequired = true;
}

export default BroadcastCommand;