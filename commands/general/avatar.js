import Command from "../../classes/command.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
const imageSize = 512;

class AvatarCommand extends Command {
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = this.client.users.get(this.author.id) ?? await this.client.rest.users.get(this.author.id);
    if (this.type === "classic" && this.message.mentions.users[0]) return this.message.mentions.users[0].avatarURL(undefined, imageSize);
    if (member && member > 21154535154122752n) {
      const user = this.client.users.get(member) ?? await this.client.rest.users.get(member);
      if (user) return user.avatarURL(undefined, imageSize);
      if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)[1];
        if (id < 21154535154122752n) {
          this.success = false;
          return this.getString("commands.responses.avatar.invalidMention");
        }
        try {
          const user = this.client.users.get(id) ?? await this.client.rest.users.get(id);
          return user.avatarURL(undefined, imageSize);
        } catch {
          return self.avatarURL(undefined, imageSize);
        }
      } else {
        return self.avatarURL(undefined, imageSize);
      }
    } else if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1
      });
      if (searched.length === 0) return self.avatarURL(undefined, imageSize);
      const user = this.client.users.get(searched[0].user.id) ?? await this.client.rest.users.get(searched[0].user.id);
      return user ? user.avatarURL(undefined, imageSize) : self.avatarURL(undefined, imageSize);
    } else {
      return self.avatarURL(undefined, imageSize);
    }
  }

  static description = "Gets a user's avatar";
  static aliases = ["pfp", "ava"];
  static flags = [{
    name: "member",
    type: 6,
    description: "The member to get the avatar from",
    classic: true,
    required: false
  }];
}

export default AvatarCommand;
