import { Constants, Member } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { getUser, mentionToObject } from "#utils/mentions.js";
const imageSize = 4096;

class BannerCommand extends Command {
  // this command sucks a little bit more again
  async run() {
    const member = this.getOptionMember("member") ?? this.getOptionUser("member") ?? this.args[0];
    const server = !!this.getOptionBoolean("server");
    const self =
      server && this.guild
        ? await this.client.rest.guilds.getMember(this.guild.id, this.author.id)
        : await this.client.rest.users.get(this.author.id); // banners are only available over REST
    if (this.type === "classic" && this.message?.mentions.users[0]) {
      return (
        (server && this.guild
          ? await this.client.rest.guilds.getMember(this.guild.id, this.message.mentions.members[0].id)
          : await this.client.rest.users.get(this.message.mentions.users[0].id)
        )?.bannerURL(undefined, imageSize) ??
        self.bannerURL(undefined, imageSize) ??
        this.getString("commands.responses.banner.noUserBanner")
      );
    }
    if (member && typeof member !== "string") {
      let restMember;
      if (member instanceof Member && server && this.guild) {
        restMember = await this.client.rest.guilds.getMember(this.guild.id, member.id);
      } else {
        restMember = await this.client.rest.users.get(member.id);
      }
      return (
        restMember.bannerURL(undefined, imageSize) ??
        self.bannerURL(undefined, imageSize) ??
        this.getString("commands.responses.banner.noUserBanner")
      );
    }
    if (member) {
      const user = await mentionToObject(this.client, member, "user", {
        guild: this.guild,
        server,
        rest: true,
      });
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
        const user = await getUser(this.client, this.guild, searched[0].user.id, server, true);
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
    {
      name: "server",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Gets a user's server banner",
      classic: true,
      default: false,
    },
  ];
}

export default BannerCommand;
