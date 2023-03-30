import { players } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class LoopCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (this.connection.host !== this.author.id && !this.member.permissions.has("MANAGE_CHANNELS")) return "Only the current voice session host can loop the music!";
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