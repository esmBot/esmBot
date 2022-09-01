import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class ShuffleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.channel.guild) return "This command only works in servers!";
    if (!this.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (this.connection.host !== this.author.id) return "Only the current voice session host can shuffle the music!";
    const object = this.connection;
    object.shuffle = !object.shuffle;
    players.set(this.channel.guild.id, object);
    this.success = true;
    return object.shuffle ? "🔊 The player is now shuffling." : "🔊 The player is no longer shuffling.";
  }

  static description = "Shuffles the music";
  static aliases = ["toggleshuffle"];
}

export default ShuffleCommand;