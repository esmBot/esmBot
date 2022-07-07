import db from "../../utils/database.js";
import Command from "../../classes/command.js";
import * as collections from "../../utils/collections.js";

class CommandCommand extends Command {
  async run() {
    if (!this.channel.guild) return "This command only works in servers!";
    const owners = process.env.OWNER.split(",");
    if (!this.member.permissions.has("administrator") && !owners.includes(this.member.id)) return "You need to be an administrator to enable/disable me!";
    if (this.args.length === 0) return "You need to provide whether you want to enable/disable a command!";
    if (this.args[0] !== "disable" && this.args[0] !== "enable") return "That's not a valid option!";
    if (!this.args[1]) return "You need to provide what command to enable/disable!";
    if (!collections.commands.has(this.args[1].toLowerCase()) && !collections.aliases.has(this.args[1].toLowerCase())) return "That isn't a command!";

    const guildDB = await db.getGuild(this.channel.guild.id);
    const disabled = guildDB.disabled_commands ?? guildDB.disabledCommands;
    const command = collections.aliases.get(this.args[1].toLowerCase()) ?? this.args[1].toLowerCase();

    if (this.args[0].toLowerCase() === "disable") {
      if (command === "command") return "You can't disable that command!";
      if (disabled && disabled.includes(command)) return "That command is already disabled!";

      await db.disableCommand(this.channel.guild.id, command);
      return `The command has been disabled. To re-enable it, just run \`${guildDB.prefix}command enable ${command}\`.`;
    } else if (this.args[0].toLowerCase() === "enable") {
      if (disabled && !disabled.includes(command)) return "That command isn't disabled!";

      await db.enableCommand(this.channel.guild.id, command);
      return `The command \`${command}\` has been re-enabled.`;
    }
  }

  static description = "Enables/disables a command for a server";
  static aliases = ["cmd"];
  static arguments = ["[enable/disable]", "[command]"];
  static slashAllowed = false;
  static directAllowed = false;
}

export default CommandCommand;
