import { Constants, Member } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { getUser, mentionToObject } from "#utils/mentions.js";
const imageSize = 512;

class AvatarCommand extends Command {
  async run() {
    const member = this.getOptionMember("member") ?? this.getOptionUser("member") ?? this.args[0];
    const server = !!this.getOptionBoolean("server");
    let self;
    if (server && this.guild) {
      self = this.member ?? this.author;
    } else {
      self = this.author;
    }
    if (this.type === "classic" && this.message?.mentions.users[0])
      return (this.message.mentions.members[0] ?? this.message.mentions.users[0])?.avatarURL(undefined, imageSize);
    if (member && typeof member !== "string") {
      return (member instanceof Member && !server ? member.user : member).avatarURL(undefined, imageSize);
    }
    if (member) {
      const user = await mentionToObject(this.client, member, "user", {
        guild: this.guild,
        server,
      });
      if (user) return user.avatarURL(undefined, imageSize);
    }
    if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1,
      });
      if (searched.length > 0) {
        const user = await getUser(this.client, this.guild, searched[0].user.id, server);
        if (user) return user.avatarURL(undefined, imageSize);
      }
    }
    return self.avatarURL(undefined, imageSize);
  }

  static description = "Gets a user's avatar";
  static aliases = ["pfp", "ava"];
  static flags = [
    {
      name: "member",
      type: Constants.ApplicationCommandOptionTypes.USER,
      description: "The member to get the avatar from",
      classic: true,
    },
    {
      name: "server",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Gets a user's server avatar",
      classic: true,
      default: false,
    },
  ];
}

export default AvatarCommand;
