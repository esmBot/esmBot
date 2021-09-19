import { skipVotes } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class SkipCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    const player = this.connection;
    if (player.host !== this.message.author.id) {
      const votes = skipVotes.has(this.message.channel.guild.id) ? skipVotes.get(this.message.channel.guild.id) : { count: 0, ids: [], max: Math.min(3, player.voiceChannel.voiceMembers.size - 1) };
      if (votes.ids.includes(this.message.author.id)) return "You've already voted to skip!";
      const newObject = {
        count: votes.count + 1,
        ids: [...votes.ids, this.message.author.id].filter(item => !!item),
        max: votes.max
      };
      if (votes.count + 1 === votes.max) {
        player.player.stop(this.message.channel.guild.id);
        skipVotes.set(this.message.channel.guild.id, { count: 0, ids: [], max: Math.min(3, player.voiceChannel.voiceMembers.size - 1) });
      } else {
        skipVotes.set(this.message.channel.guild.id, newObject);
        return `🔊 Voted to skip song (${votes.count + 1}/${votes.max} people have voted).`;
      }
    } else {
      player.player.stop(this.message.channel.guild.id);
      return;
    }
  }

  static description = "Skips the current song";
}

export default SkipCommand;