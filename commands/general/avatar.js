import Command from "../../classes/command.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;

class AvatarCommand extends Command {
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = await this.client.getRESTUser(this.author.id);
    if (this.type === "classic" && this.message.mentions[0]) {
      return this.message.mentions[0].dynamicAvatarURL(null, 512);
    } else if (await this.ipc.fetchUser(member)) {
      let user = await this.ipc.fetchUser(member);
      if (!user) user = await this.client.getRESTUser(member);
      return user?.avatar ? this.client._formatImage(`/avatars/${user.id}/${user.avatar}`, null, 512) : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`; // hacky "solution"
    } else if (mentionRegex.test(member)) {
      const id = member.match(mentionRegex)[1];
      if (id < 21154535154122752n) {
        this.success = false;
        return "That's not a valid mention!";
      }
      try {
        const user = await this.client.getRESTUser(id);
        return user.avatar ? this.client._formatImage(`/avatars/${user.id}/${user.avatar}`, null, 512) : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`; // repeat of hacky "solution" from above
      } catch {
        return self.dynamicAvatarURL(null, 512);
      }
    } else if (this.args.join(" ") !== "" && this.channel.guild) {
      const searched = await this.channel.guild.searchMembers(this.args.join(" "));
      if (searched.length === 0) return self.dynamicAvatarURL(null, 512);
      const user = await this.client.getRESTUser(searched[0].user.id);
      return user ? user.dynamicAvatarURL(null, 512) : self.dynamicAvatarURL(null, 512);
    } else {
      return self.dynamicAvatarURL(null, 512);
    }
  }

  static description = "Gets a user's avatar";
  static aliases = ["pfp", "ava"];
  static arguments = ["{mention/id}"];
  static flags = [{
    name: "member",
    type: 6,
    description: "The member to get the banner from",
    required: false
  }];
}

export default AvatarCommand;
