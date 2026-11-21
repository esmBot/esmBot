import Command from "#cmd-classes/command.js";
import { endBroadcast, startBroadcast } from "#utils/activity.js";
import { sendIPCMessage } from "#utils/ipc.js";
import { getEnv } from "#utils/runtime.js";
/** @import { CommandFlag } from "#utils/types.js" */

class BroadcastCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.broadcast.owner");
    }
    const message = this.getOptionString("message") ?? this.args.join(" ");
    if (message?.trim()) {
      await this.database?.setBroadcast(message);
      startBroadcast(this.client, message);
      sendIPCMessage("broadcastStart", message);
      return this.getString("commands.responses.broadcast.started");
    }
    await this.database?.setBroadcast();
    endBroadcast(this.client);
    sendIPCMessage("broadcastEnd");
    return this.getString("commands.responses.broadcast.ended");
  }

  /** @type {CommandFlag[]} */
  static flags = [
    {
      name: "message",
      type: "string",
      description: "The message to broadcast",
    },
  ];

  static description = "Broadcasts a playing message until the command is run again or the bot restarts";
  static adminOnly = true;
  static dbRequired = true;
}

export default BroadcastCommand;
