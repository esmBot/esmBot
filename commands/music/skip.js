const soundPlayer = require("../../utils/soundplayer.js");
const client = require("../../utils/client.js");
const MusicCommand = require("../../classes/musicCommand.js");

class SkipCommand extends MusicCommand {
  async run() {
    if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";

    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    if (!this.message.member.voiceState.channelID) return `${this.message.author.mention}, you need to be in a voice channel first!`;
    if (!this.message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${this.message.author.mention}, I'm not in a voice channel!`;
    const player = this.connection;
    if (player.host !== this.message.author.id) {
      const votes = soundPlayer.skipVotes.has(this.message.channel.guild.id) ? soundPlayer.skipVotes.get(this.message.channel.guild.id) : { count: 0, ids: [] };
      if (votes.ids.includes(this.message.author.id)) return `${this.message.author.mention}, you've already voted to skip!`;
      const newObject = {
        count: votes.count + 1,
        ids: [...votes.ids, this.message.author.id].filter(item => !!item)
      };
      if (votes.count + 1 === 3) {
        player.player.stop(this.message.channel.guild.id);
        soundPlayer.skipVotes.set(this.message.channel.guild.id, { count: 0, ids: [] });
      } else {
        soundPlayer.skipVotes.set(this.message.channel.guild.id, newObject);
        return `🔊 Voted to skip song (${votes.count + 1}/3 people have voted).`;
      }
    } else {
      player.player.stop(this.message.channel.guild.id);
      return;
    }
  }

  static description = "Skips the current song";
}

module.exports = SkipCommand;