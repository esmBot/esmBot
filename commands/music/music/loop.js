import MusicCommand from "#cmd-classes/musicCommand.js";
import { players } from "#utils/soundplayer.js";

class MusicLoopCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (this.connection.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS"))
      return this.getString("commands.responses.loop.notHost");
    const object = this.connection;
    object.loop = !object.loop;
    players.set(this.guild.id, object);
    this.success = true;
    return `🔊 ${this.getString(object.loop ? "commands.responses.loop.nowLooping" : "commands.responses.loop.notLooping")}`;
  }

  static description = "Loops the music";
  static aliases = ["loop", "toggleloop", "repeat"];
}

export default MusicLoopCommand;
