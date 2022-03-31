import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class LoopCommand extends MusicCommand {
  async run() {
    if (!this.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.author.id && !this.message.member.permissions.has("manageChannels")) return "Only the current voice session host can loop the music!";
    const object = this.connection;
    object.loop = !object.loop;
    players.set(this.channel.guild.id, object);
    return object.loop ? "🔊 The player is now looping." : "🔊 The player is no longer looping.";
  }

  static description = "Loops the music";
  static aliases = ["toggleloop", "repeat"];
}

export default LoopCommand;