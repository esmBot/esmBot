import { Constants, Member } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { safeBigInt } from "#utils/misc.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
const imageSize = 512;

class AvatarCommand extends Command {
  async run() {
    const member = this.getOptionMember("member") ?? this.args[0];
    const self = this.client.users.get(this.author.id) ?? (await this.client.rest.users.get(this.author.id));
    if (this.type === "classic" && this.message?.mentions.users[0])
      return this.message.mentions.users[0].avatarURL(undefined, imageSize);
    if (member instanceof Member) {
      return member.user.avatarURL(undefined, imageSize);
    }
    if (member) {
      let user;
      if (safeBigInt(member) > 21154535154122752n) {
        user = this.client.users.get(member) ?? (await this.client.rest.users.get(member));
      } else if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)?.[1];
        if (id && safeBigInt(id) > 21154535154122752n) {
          user = this.client.users.get(id) ?? (await this.client.rest.users.get(id));
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
        const user =
          this.client.users.get(searched[0].user.id) ?? (await this.client.rest.users.get(searched[0].user.id));
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
  ];
}

export default AvatarCommand;
