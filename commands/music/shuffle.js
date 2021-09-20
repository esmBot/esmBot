import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class ShuffleCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.message.author.id) return "Only the current voice session host can shuffle the music!";
    const object = this.connection;
    object.shuffle = !object.shuffle;
    players.set(this.message.channel.guild.id, object);
    return object.shuffle ? "🔊 The player is now shuffling." : "🔊 The player is no longer shuffling.";
  }

  static description = "Shuffles the music";
  static aliases = ["toggleshuffle"];
}

export default ShuffleCommand;