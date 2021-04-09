const soundPlayer = require("../../utils/soundplayer.js");
const client = require("../../utils/client.js");
const MusicCommand = require("../../classes/musicCommand.js");

class StopCommand extends MusicCommand {
  async run() {
    if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";

    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    if (!this.message.member.voiceState.channelID) return `${this.message.author.mention}, you need to be in a voice channel first!`;
    if (!this.message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${this.message.author.mention}, I'm not in a voice channel!`;
    if (this.connection.host !== this.message.author.id) return `${this.message.author.mention}, only the current voice session host can stop the music!`;
    soundPlayer.manager.leave(this.message.channel.guild.id);
    const connection = this.connection.player;
    connection.destroy();
    soundPlayer.players.delete(this.message.channel.guild.id);
    soundPlayer.queues.delete(this.message.channel.guild.id);
    return "🔊 The current voice channel session has ended.";
  }

  static description = "Stops the music";
  static aliases = ["disconnect"];
}

module.exports = StopCommand;