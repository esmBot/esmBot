import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class HostCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (this.connection.host !== this.author.id && !process.env.OWNER.split(",").includes(this.connection.host)) return "Only the current voice session host can choose another host!";
    const input = this.options.user ?? this.args.join(" ");
    if (input?.trim()) {
      let user;
      if (this.type === "classic") {
        const getUser = this.message.mentions.users.length >= 1 ? this.message.mentions.users[0] : this.client.users.get(input);
        if (getUser) {
          user = getUser;
        } else if (input.match(/^<?[@#]?[&!]?\d+>?$/) && input >= 21154535154122752n) {
          try {
            user = await this.client.rest.users.get(input);
          } catch {
            // no-op
          }
        } else {
          const userRegex = new RegExp(input.split(" ").join("|"), "i");
          const member = this.client.users.find(element => {
            return userRegex.test(element.username);
          });
          user = member;
        }
      } else {
        user = input;
      }
      if (!user) return "I can't find that user!";
      if (user.bot) return "This is illegal, you know.";
      const member = this.guild.members.get(user.id);
      if (!member) return "That user isn't in this server!";
      const object = this.connection;
      object.host = member.id;
      players.set(this.guildID, object);
      this.success = true;
      return `🔊 ${member.mention} is the new voice channel host.`;
    } else {
      const member = this.guild.members.get(players.get(this.guild.id).host);
      this.success = true;
      return `🔊 The current voice channel host is **${member?.username}#${member?.discriminator}**.`;
    }
  }

  static flags = [{
    name: "user",
    type: 6,
    description: "The user you want the new host to be"
  }];
  static description = "Gets or changes the host of the current voice session";
  static aliases = ["sethost"];
}

export default HostCommand;
