import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class LoopCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) return "Only the current voice session host can loop the music!";
    const object = this.connection;
    object.loop = !object.loop;
    players.set(this.guild.id, object);
    this.success = true;
    return object.loop ? "🔊 The player is now looping." : "🔊 The player is no longer looping.";
  }

  static description = "Loops the music";
  static aliases = ["toggleloop", "repeat"];
}

export default LoopCommand;