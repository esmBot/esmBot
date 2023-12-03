import { manager, players, queues } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class StopCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (this.connection?.host !== this.author.id && !this.member.permissions.has("MANAGE_CHANNELS")) return "Only the current voice session host can stop the music!";
    await manager.leaveVoiceChannel(this.guild.id);
    await this.client.leaveVoiceChannel(this.guild.id);
    players.delete(this.guild.id);
    queues.delete(this.guild.id);
    this.success = true;
    return this.connection ? `🔊 The voice channel session in \`${this.connection.voiceChannel.name}\` has ended.` : "🔊 The current voice channel session has ended.";
  }

  static description = "Stops the music";
  static aliases = ["disconnect"];
}

export default StopCommand;
