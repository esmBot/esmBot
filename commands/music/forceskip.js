import { skipVotes } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class ForceSkipCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (!this.message.member.permissions.has("manageChannels")) return "You need to have the `Manage Channels` permission to force skip!";
    this.connection.player.stop(this.message.channel.guild.id);
    skipVotes.set(this.message.channel.guild.id, { count: 0, ids: [], max: Math.min(3, this.connection.voiceChannel.voiceMembers.size - 1) });
    return;
  }

  static description = "Force skips the current song";
}

export default ForceSkipCommand;