import format from "format-duration";
import MusicCommand from "../../classes/musicCommand.js";

class NowPlayingCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return "I'm not in a voice channel!";
    if (!this.connection) return "Something odd happened to the voice connection; try playing your song again.";
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const player = this.connection.player;
    if (!player || !player.track) return "I'm not playing anything!";
    const track = await player.node.rest.decode(player.track);
    const parts = Math.floor((player.position / track.info.length) * 10);
    this.success = true;
    return {
      embeds: [{
        color: 16711680,
        author: {
          name: this.getString("sound.nowPlaying"),
          iconURL: this.client.user.avatarURL()
        },
        fields: [{
          name: `ℹ️ ${this.getString("sound.title")}`,
          value: track.info.title ?? this.getString("sound.unknown")
        },
        {
          name: `🎤 ${this.getString("sound.artist")}`,
          value: track.info.author ?? this.getString("sound.unknown")
        },
        {
          name: `💬 ${this.getString("sound.channel")}`,
          value: (this.guild.channels.get(this.member.voiceState.channelID) ?? await this.client.rest.channels.get(this.member.voiceState.channelID)).name
        },
        {
          name: `🌐 ${this.getString("sound.node")}`,
          value: player.node ? player.node.name : this.getString("sound.unknown")
        },
        {
          name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
          value: `${format(player.position)}/${track.info.isStream ? "∞" : format(track.info.length)}`
        }]
      }]
    };
  }

  static description = "Shows the currently playing song";
  static aliases = ["playing", "np", "current"];
}

export default NowPlayingCommand;
