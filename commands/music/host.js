import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class HostCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.message.author.id && this.message.author.id !== process.env.OWNER) return "Only the current voice session host can choose another host!";
    if (this.args.length === 0) return "You need to provide who you want the host to be!";
    const getUser = this.message.mentions.length >= 1 ? this.message.mentions[0] : (this.args.length !== 0 ? await this.ipc.fetchUser(this.args[0]) : null);
    let user;
    if (getUser) {
      user = getUser;
    } else if (this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] >= 21154535154122752n) {
      try {
        user = await this.client.getRESTUser(this.args[0]);
      } catch {
        // no-op
      }
    } else if (this.args.join(" ") !== "") {
      const userRegex = new RegExp(this.args.join("|"), "i");
      const member = this.client.users.find(element => {
        return userRegex.test(element.username);
      });
      user = member;
    }
    if (!user) return "I can't find that user!";
    if (user.bot) return "Setting a bot as the session host isn't a very good idea.";
    const member = this.message.channel.guild ? this.message.channel.guild.members.get(user.id) : undefined;
    if (!member) return "That user isn't in this server!";
    const object = this.connection;
    object.host = member.id;
    players.set(this.message.channel.guild.id, object);
    return `🔊 ${member.mention} is the new voice channel host.`;
  }

  static description = "Changes the host of the current voice session";
  static aliases = ["sethost"];
}

export default HostCommand;
