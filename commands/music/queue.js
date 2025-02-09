import format from "format-duration";
import { nodes } from "../../utils/soundplayer.js";
import paginator from "../../utils/pagination/pagination.js";
import MusicCommand from "../../classes/musicCommand.js";

class QueueCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.member?.voiceState) return this.getString("sound.noVoiceState");
    if (!this.guild.voiceStates.get(this.client.user.id)?.channelID) return this.getString("sound.notInVoice");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const player = this.connection;
    if (!player) return this.getString("sound.noConnection");
    const node = nodes.find((val) => val.name === player.player.node.name);
    const tracks = await fetch(`http://${node.url}/v4/decodetracks`, { method: "POST", body: JSON.stringify(this.queue), headers: { authorization: node.auth, "content-type": "application/json" } }).then(res => res.json());
    const trackList = [];
    const firstTrack = tracks.shift();
    for (const [i, track] of tracks.entries()) {
      trackList.push(`${i + 1}. ${track.info.author !== "" ? track.info.author : this.getString("sound.blank")} - **${track.info.title !== "" ? track.info.title : this.getString("sound.blank")}** (${track.info.isStream ? "∞" : format(track.info.length)})`);
    }
    const pageSize = 5;
    const embeds = [];
    const groups = trackList.map((_item, index) => {
      return index % pageSize === 0 ? trackList.slice(index, index + pageSize) : null;
    }).filter(Boolean);
    if (groups.length === 0) groups.push("del");
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [{
          author: {
            name: this.getString("sound.queue"),
            iconURL: this.client.user.avatarURL()
          },
          color: 0xff0000,
          footer: {
            text: `Page ${i + 1} of ${groups.length}`
          },
          fields: [{
            name: `🎶 ${this.getString("sound.nowPlaying")}`,
            value: `${firstTrack.info.author !== "" ? firstTrack.info.author : this.getString("sound.blank")} - **${firstTrack.info.title !== "" ? firstTrack.info.title : this.getString("sound.blank")}** (${firstTrack.info.isStream ? "∞" : format(firstTrack.info.length)})`
          }, {
            name: `🔁 ${this.getString("sound.looping")}`,
            value: player.loop ? this.getString("sound.yes") : this.getString("sound.no")
          }, {
            name: `🌐 ${this.getString("sound.node")}`,
            value: player.player.node ? player.player.node.name : this.getString("sound.unknown")
          }, {
            name: `🗒️ ${this.getString("sound.queue")}`,
            value: value !== "del" ? value.join("\n") : this.getString("sound.noQueue")
          }]
        }]
      });
    }
    if (embeds.length === 0) return this.getString("sound.noQueue");
    this.success = true;
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "Shows the current queue";
  static aliases = ["q"];
}

export default QueueCommand;
