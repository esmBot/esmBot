import database from "../../utils/database.js";
import Command from "../../classes/command.js";

class PrefixCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    const guild = await database.getGuild(this.message.channel.guild.id);
    if (this.args.length !== 0) {
      const owners = process.env.OWNER.split(",");
      if (!this.message.member.permissions.has("administrator") && !owners.includes(this.message.member.id)) return "You need to be an administrator to change the bot prefix!";
      await database.setPrefix(this.args[0], this.message.channel.guild);
      return `The prefix has been changed to ${this.args[0]}.`;
    } else {
      return `The current prefix is \`${guild.prefix}\`.`;
    }
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static arguments = ["{prefix}"];
}

export default PrefixCommand;