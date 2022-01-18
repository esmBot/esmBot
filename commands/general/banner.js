import Command from "../../classes/command.js";

class BannerCommand extends Command {
  async run() {
    if (this.message.mentions[0]) {
      return this.message.mentions[0].banner ? this.message.mentions[0].dynamicBannerURL(null, 1024) : "This user doesn't have a banner!";
    } else if (await this.ipc.fetchUser(this.args[0])) {
      const user = await this.ipc.fetchUser(this.args[0]);
      return user.banner ? this.client._formatImage(`/banners/${user.id}/${user.banner}`, null, 1024) : "This user doesn't have a banner!";
    } else if (this.args[0] && this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] >= 21154535154122752n) {
      try {
        const user = await this.client.getRESTUser(this.args[0]);
        return user.banner ? this.client._formatImage(`/banners/${user.id}/${user.banner}`, null, 1024) : "This user doesn't have a banner!";
      } catch {
        return this.message.author.banner ? this.message.author.dynamicBannerURL(null, 1024) : "You don't have a banner!";
      }
    } else if (this.args.join(" ") !== "" && this.message.channel.guild) {
      const userRegex = new RegExp(this.args.join("|"), "i");
      const member = this.message.channel.guild.members.find(element => {
        return userRegex.test(element.nick) ?? userRegex.test(element.username);
      });
      return member && member.user.banner ? member.user.dynamicBannerURL(null, 1024) : (this.message.author.banner ? this.message.author.dynamicBannerURL(null, 1024) : "This user doesn't have a banner!");
    } else {
      return this.message.author.banner ? this.message.author.dynamicBannerURL(null, 1024) : "You don't have a banner!";
    }
  }

  static description = "Gets a user's banner";
  static aliases = ["userbanner"];
  static arguments = ["{mention/id}"];
}

export default BannerCommand;
