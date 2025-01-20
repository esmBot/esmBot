import Command from "../../classes/command.js";
import { Routes } from "oceanic.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
const imageSize = 4096

class BannerCommand extends Command {
  // this command sucks
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = await this.client.rest.users.get(this.author.id); // banners are only available over REST
    if (this.type === "classic" && this.message?.mentions.users[0]) {
      return this.message.mentions.users[0].bannerURL(undefined, imageSize) ?? self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noUserBanner");
    }
    if (member && member > 21154535154122752n) {
      const user = await this.client.rest.users.get(member);
      if (user?.banner) return user.bannerURL(undefined, imageSize) ?? self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noUserBanner");
      if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)[1];
        if (id < 21154535154122752n) {
          this.success = false;
          return this.getString("commands.responses.banner.invalidMention");
        }
        try {
          const user = await this.client.rest.users.get(id);
          return user.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noUserBanner");
        } catch {
          return self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noSelfBanner");
        }
      } else {
        return this.getString("commands.responses.banner.noUserBanner");
      }
    } else if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1
      });
      if (searched.length === 0) return self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noUserBanner");
      const user = await this.client.rest.users.get(searched[0].user.id);
      return user.bannerURL(undefined, imageSize) ?? self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noUserBanner");
    } else {
      return self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noSelfBanner");
    }
  }

  static description = "Gets a user's banner";
  static aliases = ["userbanner"];
  static flags = [{
    name: "member",
    type: 6,
    description: "The member to get the banner from",
    classic: true,
    required: false
  }];
}

export default BannerCommand;
