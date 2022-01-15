import Command from "../../classes/command.js";

class AvatarCommand extends Command {
  async run() {
    if (this.message.mentions[0]) {
      return this.message.mentions[0].dynamicAvatarURL(null, 1024);
    } else if (await this.ipc.fetchUser(this.args[0])) {
      const user = await this.ipc.fetchUser(this.args[0]);
      return user.avatar ? this.client._formatImage(`/avatars/${user.id}/${user.avatar}`, null, 1024) : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`; // hacky "solution"
    } else if (this.args[0] && this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] >= 21154535154122752n) {
      try {
        const user = await this.client.getRESTUser(this.args[0]);
        return user.avatar ? this.client._formatImage(`/avatars/${user.id}/${user.avatar}`, null, 1024) : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`; // repeat of hacky "solution" from above
      } catch {
        return this.message.author.dynamicAvatarURL(null, 1024);
      }
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

export default AvatarCommand;
