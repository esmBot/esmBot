import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class ShuffleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.members.get(this.client.user.id).voiceState) return "I'm not in a voice channel!";
    if (!this.connection) return "I haven't completely connected yet!";
    if (this.connection.host !== this.author.id) return "Only the current voice session host can shuffle the music!";
    const object = this.connection;
    object.shuffle = !object.shuffle;
    players.set(this.guildID, object);
    this.success = true;
    return object.shuffle ? "🔊 The player is now shuffling." : "🔊 The player is no longer shuffling.";
  }

  static description = "Shuffles the music";
  static aliases = ["toggleshuffle"];
}

export default ShuffleCommand;