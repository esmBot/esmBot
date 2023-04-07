import { request } from "undici";
import format from "format-duration";
import { nodes } from "../../utils/soundplayer.js";
import paginator from "../../utils/pagination/pagination.js";
import MusicCommand from "../../classes/musicCommand.js";

class QueueCommand extends MusicCommand {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    if (!this.member.voiceState) return "You need to be in a voice channel first!";
    if (!this.guild.voiceStates.has(this.client.user.id)) return "I'm not in a voice channel!";
    if (!this.permissions.has("EMBED_LINKS")) return "I don't have the `Embed Links` permission!";
    const player = this.connection;
    if (!player) return "Something odd happened to the voice connection; try playing your song again.";
    const node = nodes.filter((val) => val.name === player.player.node.name)[0];
    const tracks = await request(`http://${node.url}/decodetracks`, { method: "POST", body: JSON.stringify(this.queue), headers: { authorization: node.auth, "content-type": "application/json" } }).then(res => res.body.json());
    const trackList = [];
    const firstTrack = tracks.shift();
    for (const [i, track] of tracks.entries()) {
      trackList.push(`${i + 1}. ${track.info.author !== "" ? track.info.author : "(blank)"} - **${track.info.title !== "" ? track.info.title : "(blank)"}** (${track.info.isStream ? "∞" : format(track.info.length)})`);
    }
    const pageSize = 5;
    const embeds = [];
    const groups = trackList.map((item, index) => {
      return index % pageSize === 0 ? trackList.slice(index, index + pageSize) : null;
    }).filter(Boolean);
    if (groups.length === 0) groups.push("del");
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [{
          author: {
            name: "Queue",
            iconURL: this.client.user.avatarURL()
          },
          color: 16711680,
          footer: {
            text: `Page ${i + 1} of ${groups.length}`
          },
          fields: [{
            name: "🎶 Now Playing",
            value: `${firstTrack.info.author !== "" ? firstTrack.info.author : "(blank)"} - **${firstTrack.info.title !== "" ? firstTrack.info.title : "(blank)"}** (${firstTrack.info.isStream ? "∞" : format(firstTrack.info.length)})`
          }, {
            name: "🔁 Looping?",
            value: player.loop ? "Yes" : "No"
          }, {
            name: "🌐 Node",
            value: player.player.node ? player.player.node.name : "Unknown"
          }, {
            name: "🗒️ Queue",
            value: value !== "del" ? value.join("\n") : "There's nothing in the queue!"
          }]
        }]
      });
    }
    if (embeds.length === 0) return "There's nothing in the queue!";
    this.success = true;
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "Shows the current queue";
  static aliases = ["q"];
}

export default QueueCommand;