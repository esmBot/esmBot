import Command from "#cmd-classes/command.js";
import { paths } from "#utils/collections.js";
import { load, send } from "#utils/handler.js";
import { sendIPCMessage } from "#utils/ipc.js";
import { getEnv } from "#utils/runtime.js";
/** @import { CommandFlag } from "#utils/types.js" */

class ReloadCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) return this.getString("commands.responses.reload.botOwnerOnly");
    const commandName = this.getOptionString("cmd") ?? this.args.join(" ");
    if (!commandName || !commandName.trim()) return this.getString("commands.responses.reload.noInput");
    await this.acknowledge();
    const path = paths.get(commandName);
    if (!path) return this.getString("commands.responses.reload.noCommand");
    const result = await load(path);
    const skipSend = this.getOptionBoolean("skipsend");
    if (!skipSend) {
      await send(this.client);
    }
    if (result?.name !== commandName) return this.getString("commands.responses.reload.reloadFailed");
    sendIPCMessage("reload", commandName);
    return this.getString("commands.responses.reload.reloaded", {
      params: {
        command: commandName,
      },
    });
  }

  /** @type {CommandFlag[]} */
  static flags = [
    {
      name: "cmd",
      type: "string",
      description: "The command to reload",
      classic: true,
      required: true,
    },
    {
      name: "skipsend",
      type: "boolean",
      description: "Skips sending new application command data to Discord",
      classic: true,
    },
  ];

  static description = "Reloads a command";
  static adminOnly = true;
}

export default ReloadCommand;
