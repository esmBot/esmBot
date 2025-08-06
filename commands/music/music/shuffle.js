import MusicCommand from "#cmd-classes/musicCommand.js";
import { players } from "#utils/soundplayer.js";

class MusicShuffleCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id) return this.getString("commands.responses.shuffle.notHost");
    const object = this.connection;
    object.shuffle = !object.shuffle;
    players.set(this.guild.id, object);
    this.success = true;
    return `🔊 ${this.getString(object.shuffle ? "commands.responses.shuffle.nowShuffling" : "commands.responses.shuffle.notShuffling")}`;
  }

  static description = "Shuffles the music";
  static aliases = ["shuffle", "toggleshuffle"];
}

export default MusicShuffleCommand;
