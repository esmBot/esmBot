import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { paths } from "#utils/collections.js";
import { load } from "#utils/handler.js";

class ReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) return this.getString("commands.responses.reload.botOwnerOnly");
    const commandName = this.getOptionString("cmd") ?? this.args.join(" ");
    if (!commandName || !commandName.trim()) return this.getString("commands.responses.reload.noInput");
    await this.acknowledge();
    const path = paths.get(commandName);
    if (!path) return this.getString("commands.responses.reload.noCommand");
    const result = await load(this.client, path, this.getOptionBoolean("skipsend"));
    if (result !== commandName) return this.getString("commands.responses.reload.reloadFailed");
    if (process.env.PM2_USAGE) {
      process.send?.({
        type: "process:msg",
        data: {
          type: "reload",
          from: process.env.pm_id,
          message: commandName,
        },
      });
    }
    return this.getString("commands.responses.reload.reloaded", {
      params: {
        command: commandName,
      },
    });
  }

  static flags = [
    {
      name: "cmd",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The command to reload",
      classic: true,
      required: true,
    },
    {
      name: "skipsend",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Skips sending new application command data to Discord",
      classic: true,
    },
  ];

  static description = "Reloads a command";
  static adminOnly = true;
}

export default ReloadCommand;
