const db = require("../../utils/database.js");
const Command = require("../../classes/command.js");
const collections = require("../../utils/collections.js");

class CommandCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.permissions.has("administrator") && this.message.member.id !== process.env.OWNER) return "You need to be an administrator to enable/disable me!";
    if (this.args.length === 0) return "You need to provide what command to enable/disable!";
    if (this.args[0] !== "disable" && this.args[0] !== "enable") return "That's not a valid option!";

    const guildDB = await db.getGuild(this.message.channel.guild.id);

    if (this.args[0].toLowerCase() === "disable") {
      if (!collections.commands.has(this.args[1].toLowerCase()) && !collections.aliases.has(this.args[1].toLowerCase())) return "That isn't a command!";
      const command = collections.aliases.has(this.args[1].toLowerCase()) ? collections.aliases.get(this.args[1].toLowerCase()) : this.args[1].toLowerCase();
      if (guildDB.disabled_commands && guildDB.disabled_commands.includes(command)) return "That command is already disabled!";

      await db.disableCommand(this.message.channel.guild.id, command);
      return `The command has been disabled. To re-enable it, just run \`${guildDB.prefix}command enable ${command}\`.`;
    } else if (this.args[0].toLowerCase() === "enable") {
      if (!collections.commands.has(this.args[1].toLowerCase()) && !collections.aliases.has(this.args[1].toLowerCase())) return "That isn't a command!";
      const command = collections.aliases.has(this.args[1].toLowerCase()) ? collections.aliases.get(this.args[1].toLowerCase()) : this.args[1].toLowerCase();
      if (guildDB.disabled_commands && !guildDB.disabled_commands.includes(command)) return "That command isn't disabled!";

      await db.enableCommand(this.message.channel.guild.id, command);
      return `The command \`${command}\` has been re-enabled.`;
    }
  }

  static description = "Enables/disables a command for a server";
  static aliases = ["cmd"];
  static arguments = ["[enable/disable]", "[command]"];
}

module.exports = CommandCommand;