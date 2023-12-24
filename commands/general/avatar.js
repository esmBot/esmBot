import Command from "#cmd-classes/command.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;
const imageSize = 512;

class AvatarCommand extends Command {
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = this.client.users.get(this.author.id) ?? await this.client.rest.users.get(this.author.id);
    if (this.type === "classic" && this.message.mentions.users[0]) {
      return this.message.mentions.users[0].avatarURL(null, imageSize);
    } else if (member && member > 21154535154122752n) {
      const user = this.client.users.get(member) ?? await this.client.rest.users.get(member);
      if (user) {
        return user.avatarURL(null, imageSize);
      } else if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)[1];
        if (id < 21154535154122752n) {
          this.success = false;
          return "That's not a valid mention!";
        }
        try {
          const user = this.client.users.get(id) ?? await this.client.rest.users.get(id);
          return user.avatarURL(null, imageSize);
        } catch {
          return self.avatarURL(null, imageSize);
        }
      } else {
        return self.avatarURL(null, imageSize);
      }
    } else if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1
      });
      if (searched.length === 0) return self.avatarURL(null, imageSize);
      const user = this.client.users.get(searched[0].user.id) ?? await this.client.rest.users.get(searched[0].user.id);
      return user ? user.avatarURL(null, imageSize) : self.avatarURL(null, imageSize);
    } else {
      return self.avatarURL(null, imageSize);
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
