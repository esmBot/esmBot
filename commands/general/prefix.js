import database from "../../utils/database.js";
import Command from "../../classes/command.js";

class PrefixCommand extends Command {
  async run() {
    if (!this.channel.guild) return `The current prefix is \`${process.env.PREFIX}\``;
    const guild = await database.getGuild(this.channel.guild.id);
    if (this.args.length !== 0) {
      const owners = process.env.OWNER.split(",");
      if (!this.member.permissions.has("administrator") && !owners.includes(this.member.id)) return "You need to be an administrator to change the bot prefix!";
      await database.setPrefix(this.args[0], this.channel.guild);
      return `The prefix has been changed to ${this.args[0]}.`;
    } else {
      return `The current prefix is \`${guild.prefix}\`.`;
    }
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static arguments = ["{prefix}"];
  static slashAllowed = false;
}

export default PrefixCommand;