import format from "format-duration";
import MusicCommand from "../../classes/musicCommand.js";

class NowPlayingCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    const player = this.connection.player;
    if (!player) return "I'm not playing anything!";
    const track = await player.node.rest.decode(player.track);
    const parts = Math.floor((player.position / track.length) * 10);
    this.success = true;
    return {
      embeds: [{
        color: 16711680,
        author: {
          name: "Now Playing",
          iconURL: this.client.user.avatarURL()
        },
        fields: [{
          name: "ℹ️ Title",
          value: track.title ? track.title : "Unknown"
        },
        {
          name: "🎤 Artist",
          value: track.author ? track.author : "Unknown"
        },
        {
          name: "💬 Channel",
          value: (this.guild.channels.get(this.member.voiceState.channelID) ?? await this.client.rest.channels.get(this.member.voiceState.channelID)).name
        },
        {
          name: "🌐 Node",
          value: player.node ? player.node.name : "Unknown"
        },
        {
          name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
          value: `${format(player.position)}/${track.isStream ? "∞" : format(track.length)}`
        }]
      }]
    };
  }

  static description = "Shows the currently playing song";
  static aliases = ["playing", "np", "current"];
}

export default NowPlayingCommand;
