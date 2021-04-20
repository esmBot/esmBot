const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class LoopCommand extends MusicCommand {
  async run() {
    if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";

    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    if (!this.message.member.voiceState.channelID) return `${this.message.author.mention}, you need to be in a voice channel first!`;
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return `${this.message.author.mention}, I'm not in a voice channel!`;
    if (this.connection.host !== this.message.author.id) return `${this.message.author.mention}, only the current voice session host can loop the music!`;
    const object = this.connection;
    object.loop = !object.loop;
    soundPlayer.players.set(this.message.channel.guild.id, object);
    return object.loop ? "🔊 The player is now looping." : "🔊 The player is no longer looping.";
  }

  static description = "Loops the music";
  static aliases = ["toggleloop", "repeat"];
}

module.exports = LoopCommand;