import MusicCommand from "#cmd-classes/musicCommand.js";
import { formatDuration } from "#utils/misc.js";

class MusicNowPlayingCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.connection) return this.getString("sound.noConnection");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const player = this.connection.player;
    if (!player || !player.track) return this.getString("sound.notPlaying");
    const track = this.queue[0];
    const voiceChannel =
      this.client.getChannel(this.connection.voiceChannel) ??
      (await this.client.rest.channels.get(this.connection.voiceChannel));
    const parts = Math.floor((player.position / track.info.length) * 10);
    this.success = true;
    return {
      embeds: [
        {
          color: 0xff0000,
          author: {
            name: this.getString("sound.nowPlaying"),
            iconURL: this.client.user.avatarURL(),
          },
          fields: [
            {
              name: `ℹ️ ${this.getString("sound.title")}`,
              value: track.info.title ?? this.getString("sound.unknown"),
            },
            {
              name: `🎤 ${this.getString("sound.artist")}`,
              value: track.info.author ?? this.getString("sound.unknown"),
            },
            {
              name: `💬 ${this.getString("sound.channel")}`,
              value: "name" in voiceChannel && voiceChannel.name ? voiceChannel.name : this.connection.voiceChannel,
            },
            {
              name: `🌐 ${this.getString("sound.node")}`,
              value: player.node ? player.node.name : this.getString("sound.unknown"),
            },
            {
              name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
              value: `${formatDuration(player.position)}/${track.info.isStream ? "∞" : formatDuration(track.info.length)}`,
            },
          ],
        },
      ],
    };
  }

  static description = "Shows the currently playing song";
  static aliases = ["nowplaying", "playing", "np", "current"];
}

export default MusicNowPlayingCommand;
