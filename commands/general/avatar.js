const Command = require("../../classes/command.js");

class AvatarCommand extends Command {
  async run() {
    if (this.message.mentions[0] !== undefined) {
      return this.message.mentions[0].dynamicAvatarURL(null, 1024);
    } else if (await this.ipc.fetchUser(this.args[0]) !== undefined) {
      return await this.ipc.fetchUser(this.args[0]).dynamicAvatarURL(null, 1024);
    } else if (this.args.join(" ") !== "" && this.message.channel.guild) {
      const userRegex = new RegExp(this.args.join("|"), "i");
      const member = this.message.channel.guild.members.find(element => {
        return userRegex.test(element.nick) ? userRegex.test(element.nick) : userRegex.test(element.username);
      });
      return member ? member.user.dynamicAvatarURL(null, 1024) : this.message.author.dynamicAvatarURL(null, 1024);
    } else {
      return this.message.author.dynamicAvatarURL(null, 1024);
    }
  }

  static description = "Gets a user's avatar";
  static aliases = ["pfp", "ava"];
  static arguments = ["{mention/id}"];
}

module.exports = AvatarCommand;