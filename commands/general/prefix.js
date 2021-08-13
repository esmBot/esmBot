const database = require("../../utils/database.js");
const Command = require("../../classes/command.js");

class PrefixCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    const guild = await database.getGuild(this.message.channel.guild.id);
    if (this.args.length !== 0) {
      if (!this.message.member.permissions.has("administrator") && this.message.member.id !== process.env.OWNER) return "You need to be an administrator to change the bot prefix!";
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

module.exports = PrefixCommand;