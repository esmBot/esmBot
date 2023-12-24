import { players } from "#utils/soundplayer.js";
import MusicCommand from "#cmd-classes/musicCommand.js";

class ShuffleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id) return "Only the current voice session host can shuffle the music!";
    const object = this.connection;
    object.shuffle = !object.shuffle;
    players.set(this.guild.id, object);
    this.success = true;
    return object.shuffle ? "🔊 The player is now shuffling." : "🔊 The player is no longer shuffling.";
  }

  static description = "Shuffles the music";
  static aliases = ["toggleshuffle"];
}

export default ShuffleCommand;