import Command from "../../classes/command.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;

class BannerCommand extends Command {
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = await this.client.getRESTUser(this.author.id);
    if (this.type === "classic" && this.message.mentions[0]) {
      return this.message.mentions[0].dynamicBannerURL(null, 512) ?? "This user doesn't have a banner!";
    } else if (member) {
      const user = await this.client.getRESTUser(member);
      if (user) {
        return user.dynamicBannerURL(null, 512) ?? "This user doesn't have a banner!";
      } else if (mentionRegex.text(member)) {
        const id = member.match(mentionRegex)[1];
        if (id < 21154535154122752n) {
          this.success = false;
          return "That's not a valid mention!";
        }
        try {
          const user = await this.client.getRESTUser(id);
          return user.dynamicBannerURL(null, 512) ?? "This user doesn't have a banner!";
        } catch {
          return self.dynamicBannerURL(null, 512) ?? "You don't have a banner!";
        }
      } else {
        return "This user doesn't have a banner!";
      }
    } else if (this.args.join(" ") !== "" && this.channel.guild) {
      const searched = await this.channel.guild.searchMembers(this.args.join(" "));
      if (searched.length === 0) return self.dynamicBannerURL(null, 512) ?? "This user doesn't have a banner!";
      const user = await this.client.getRESTUser(searched[0].user.id);
      return user.dynamicBannerURL(null, 512) ?? (self.dynamicBannerURL(null, 512) ?? "This user doesn't have a banner!");
    } else {
      
      return self.dynamicBannerURL(null, 512) ?? "You don't have a banner!";
    }
  }

  static description = "Gets a user's banner";
  static aliases = ["userbanner"];
  static arguments = ["{mention/id}"];
  static flags = [{
    name: "member",
    type: 6,
    description: "The member to get the banner from",
    required: false
  }];
}

export default BannerCommand;
