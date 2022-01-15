import { Rest } from "lavacord";
import format from "format-duration";
import MusicCommand from "../../classes/musicCommand.js";

class NowPlayingCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    const player = this.connection.player;
    if (!player) return "I'm not playing anything!";
    const track = await Rest.decode(player.node, player.track);
    const parts = Math.floor((player.state.position / track.length) * 10);
    return {
      embeds: [{
        color: 16711680,
        author: {
          name: "Now Playing",
          icon_url: this.client.user.avatarURL
        },
        fields: [{
          name: "ℹ️ Title:",
          value: track.title ? track.title : "Unknown"
        },
        {
          name: "🎤 Artist:",
          value: track.author ? track.author : "Unknown"
        },
        {
          name: "💬 Channel:",
          value: this.message.channel.guild.channels.get(this.message.member.voiceState.channelID).name
        },
        {
          name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
          value: `${format(player.state.position)}/${track.isStream ? "∞" : format(track.length)}`
        }]
      }]
    };
  }

  static description = "Shows the currently playing song";
  static aliases = ["playing", "np"];
}

export default NowPlayingCommand;
