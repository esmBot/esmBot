import Command from "#cmd-classes/command.js";
import { aliases, commands } from "#utils/collections.js";

class CommandEnableCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.database) return this.getString("noDatabase");
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id))
      return this.getString("commands.responses.command.adminOnly");

    const commandName = this.getOptionString("cmd", true)?.toLowerCase();
    if (!commandName) return this.getString("commands.responses.command.noInput");
    if (!commands.has(commandName.split(" ")[0]) && !aliases.has(commandName))
      return this.getString("commands.responses.command.invalidCmd");

    const guildDB = await this.database.getGuild(this.guild.id);
    const command = aliases.get(commandName) ?? commandName;

    if (!guildDB.disabled_commands.includes(command)) return this.getString("commands.responses.command.notDisabled");

    await this.database.enableCommand(this.guild.id, command);
    this.success = true;
    return this.getString("commands.responses.command.reEnabled", { params: { command } });
  }

  static description = "Enables a classic command";
  static flags = [
    {
      name: "cmd",
      type: "string",
      description: "The command to enable",
      classic: true,
      required: true,
    },
  ];
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default CommandEnableCommand;
