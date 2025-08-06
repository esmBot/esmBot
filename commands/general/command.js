import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import * as collections from "#utils/collections.js";

class CommandCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.database) return this.getString("noDatabase");
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id))
      return this.getString("commands.responses.command.adminOnly");
    if (this.args.length === 0) return this.getString("commands.responses.command.noCmd");
    if (this.args[0] !== "disable" && this.args[0] !== "enable")
      return this.getString("commands.responses.command.invalid");
    const commandName = this.args.slice(1).join(" ").toLowerCase();
    if (commandName.length === 0) return this.getString("commands.responses.command.noInput");
    if (!collections.commands.has(this.args[1]) && !collections.aliases.has(commandName))
      return this.getString("commands.responses.command.invalidCmd");

    const guildDB = await this.database.getGuild(this.guild.id);
    const command = collections.aliases.get(commandName) ?? commandName;

    if (this.args[0].toLowerCase() === "disable") {
      if (command === "command") return this.getString("commands.responses.command.cannotDisable");
      if (guildDB.disabled_commands.includes(command))
        return this.getString("commands.responses.command.alreadyDisabled");

      await this.database.disableCommand(this.guild.id, command);
      this.success = true;
      return this.getString("commands.responses.command.disabled", {
        params: {
          command,
          prefix: guildDB.prefix,
        },
      });
    }
    if (this.args[0].toLowerCase() === "enable") {
      if (!guildDB.disabled_commands.includes(command)) return this.getString("commands.responses.command.notDisabled");

      await this.database.enableCommand(this.guild.id, command);
      this.success = true;
      return this.getString("commands.responses.command.reEnabled", { params: { command } });
    }
  }

  static description = "Enables/disables a classic command for a server (use server settings for slash commands)";
  static aliases = ["cmd"];
  static flags = [
    {
      name: "enable",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Enables a classic command",
      options: [
        {
          name: "cmd",
          type: Constants.ApplicationCommandOptionTypes.STRING,
          description: "The command to enable",
          classic: true,
          required: true,
        },
      ],
    },
    {
      name: "disable",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Disables a classic command",
      options: [
        {
          name: "cmd",
          type: Constants.ApplicationCommandOptionTypes.STRING,
          description: "The command to disable",
          classic: true,
          required: true,
        },
      ],
    },
  ];
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default CommandCommand;
