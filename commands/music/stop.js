import MusicCommand from "#cmd-classes/musicCommand.js";
import { leaveChannel, players, queues, skipVotes } from "#utils/soundplayer.js";

class StopCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (this.connection?.host !== this.author.id && !this.memberPermissions.has("MANAGE_CHANNELS")) return this.getString("commands.responses.stop.notHost");
    players.delete(this.guild.id);
    queues.delete(this.guild.id);
    skipVotes.delete(this.guild.id);
    await leaveChannel(this.guild.id);
    this.success = true;
    return `🔊 ${this.getString(this.connection ? "sound.endedInChannel" : "commands.responses.stop.ended", this.connection ? {
      params: {
        channel: this.connection.voiceChannel.name
      }
    } : undefined)}`;
  }

  static description = "Stops the music";
  static aliases = ["disconnect"];
}

export default StopCommand;
