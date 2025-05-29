import { Constants, Member } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { safeBigInt } from "#utils/misc.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
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
      let user;
      if (safeBigInt(member) > 21154535154122752n) {
        if (server && this.guild) {
          user = this.guild.members.get(member) ?? (await this.client.rest.guilds.getMember(this.guild.id, member));
        } else {
          user = this.client.users.get(member) ?? (await this.client.rest.users.get(member));
        }
      } else if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)?.[1];
        if (id && safeBigInt(id) > 21154535154122752n) {
          if (server && this.guild) {
            user = this.guild.members.get(id) ?? (await this.client.rest.guilds.getMember(this.guild.id, id));
          } else {
            user = this.client.users.get(id) ?? (await this.client.rest.users.get(id));
          }
        }
      }
      if (user) return user.avatarURL(undefined, imageSize);
    }
    if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1,
      });
      if (searched.length > 0) {
        let user;
        if (server && this.guild) {
          user =
            this.guild.members.get(searched[0].user.id) ??
            (await this.client.rest.guilds.getMember(this.guild.id, searched[0].user.id));
        } else {
          user = this.client.users.get(searched[0].user.id) ?? (await this.client.rest.users.get(searched[0].user.id));
        }
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
