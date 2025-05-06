import { Constants, Member } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { safeBigInt } from "#utils/misc.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
const imageSize = 4096;

class BannerCommand extends Command {
  // this command now sucks slightly less
  async run() {
    const member = this.getOptionMember("member") ?? this.args[0];
    const self = await this.client.rest.users.get(this.author.id); // banners are only available over REST
    if (this.type === "classic" && this.message?.mentions.users[0]) {
      return (
        this.message.mentions.users[0].bannerURL(undefined, imageSize) ??
        self.bannerURL(undefined, imageSize) ??
        this.getString("commands.responses.banner.noUserBanner")
      );
    }
    if (member instanceof Member) {
      return (
        member.bannerURL(undefined, imageSize) ??
        self.bannerURL(undefined, imageSize) ??
        this.getString("commands.responses.banner.noUserBanner")
      );
    }
    if (member) {
      let user;
      if (safeBigInt(member) > 21154535154122752n) {
        user = await this.client.rest.users.get(member);
      } else if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)?.[1];
        if (id && safeBigInt(id) > 21154535154122752n) {
          user = await this.client.rest.users.get(id);
        }
      }
      if (user?.banner)
        return (
          user.bannerURL(undefined, imageSize) ??
          self.bannerURL(undefined, imageSize) ??
          this.getString("commands.responses.banner.noUserBanner")
        );
    }
    if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1,
      });
      if (searched.length > 0) {
        const user = await this.client.rest.users.get(searched[0].user.id);
        return (
          user.bannerURL(undefined, imageSize) ??
          self.bannerURL(undefined, imageSize) ??
          this.getString("commands.responses.banner.noUserBanner")
        );
      }
    }
    return self.bannerURL(undefined, imageSize) ?? this.getString("commands.responses.banner.noSelfBanner");
  }

  static description = "Gets a user's banner";
  static aliases = ["userbanner"];
  static flags = [
    {
      name: "member",
      type: Constants.ApplicationCommandOptionTypes.USER,
      description: "The member to get the banner from",
      classic: true,
    },
  ];
}

export default BannerCommand;
