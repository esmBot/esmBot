const database = require("../../utils/database");
const Command = require("../../classes/command");

class PrefixCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    const guild = await database.getGuild(this.message.channel.guild.id);
    if (this.args.length !== 0) {
      if (!this.message.member.permission.has("administrator") && this.message.member.id !== process.env.OWNER) return `${this.message.author.mention}, you need to be an administrator to change the bot prefix!`;
      await database.setPrefix(this.args[0], this.message.channel.guild);
      return `The prefix has been changed to ${this.args[0]}.`;
    } else {
      return `${this.message.author.mention}, the current prefix is \`${guild.prefix}\`.`;
    }
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static arguments = ["{prefix}"];
}

module.exports = PrefixCommand;