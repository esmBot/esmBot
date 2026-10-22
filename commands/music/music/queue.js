import MusicCommand from "#cmd-classes/musicCommand.js";
import { PaginationMixin } from "#pagination";
import { formatDuration } from "#utils/misc.js";

class MusicQueueCommand extends PaginationMixin(MusicCommand) {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const player = this.connection;
    if (!player) return this.getString("sound.noConnection");
    const trackList = [];
    const tracks = this.queue;
    const firstTrack = tracks[0];
    if (!firstTrack) return this.getString("sound.notPlaying");
    for (const [i, track] of tracks.entries()) {
      if (i === 0) continue;
      trackList.push(
        `${i + 1}. ${track.info.author !== "" ? track.info.author : this.getString("sound.blank")} - **${track.info.title !== "" ? track.info.title : this.getString("sound.blank")}** (${track.info.isStream ? "∞" : formatDuration(track.info.length)})`,
      );
    }
    const pageSize = 5;
    const embeds = [];
    const groups = [];
    let arrIndex = 0;
    for (let i = 0; i < trackList.length; i += pageSize) {
      groups[arrIndex] = trackList.slice(i, i + pageSize);
      arrIndex++;
    }
    if (groups.length === 0) groups.push([]);
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            author: {
              name: this.getString("sound.queue"),
              iconURL: this.client.user.avatarURL(),
            },
            color: 0xff0000,
            footer: {
              text: this.getString("pagination.page", {
                params: {
                  page: (i + 1).toString(),
                  amount: groups.length.toString(),
                },
              }),
            },
            fields: [
              {
                name: `🎶 ${this.getString("sound.nowPlaying")}`,
                value: `${firstTrack.info.author !== "" ? firstTrack.info.author : this.getString("sound.blank")} - **${firstTrack.info.title !== "" ? firstTrack.info.title : this.getString("sound.blank")}** (${firstTrack.info.isStream ? "∞" : formatDuration(firstTrack.info.length)})`,
              },
              {
                name: `🔁 ${this.getString("sound.looping")}`,
                value: player.loop ? this.getString("sound.yes") : this.getString("sound.no"),
              },
              {
                name: `🌐 ${this.getString("sound.node")}`,
                value: player.player.node ? player.player.node.name : this.getString("sound.unknown"),
              },
              {
                name: `🗒️ ${this.getString("sound.queue")}`,
                value: value.length !== 0 ? value.join("\n") : this.getString("sound.noQueue"),
              },
            ],
          },
        ],
      });
    }
    if (embeds.length === 0) return this.getString("sound.noQueue");
    this.success = true;
    return this.paginator(embeds);
  }

  static description = "Shows the current queue";
  static aliases = ["queue", "q"];
}

export default MusicQueueCommand;
