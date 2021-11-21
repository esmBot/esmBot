//import { Rest } from "lavacord";
import fetch from "node-fetch";
import format from "format-duration";
import paginator from "../../utils/pagination/pagination.js";
import MusicCommand from "../../classes/musicCommand.js";

class QueueCommand extends MusicCommand {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    if (!this.message.member.voiceState.channelID) return "You need to be in a voice channel first!";
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return "I'm not in a voice channel!";
    if (!this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return "I don't have the `Embed Links` permission!";
    const player = this.connection;
    //const tracks = await Rest.decode(player.player.node, queue);
    const tracks = await fetch(`http://${player.player.node.host}:${player.player.node.port}/decodetracks`, { method: "POST", body: JSON.stringify(this.queue), headers: { Authorization: player.player.node.password, "Content-Type": "application/json" } }).then(res => res.json());
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
            icon_url: this.client.user.avatarURL
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
            name: "🗒️ Queue",
            value: value !== "del" ? value.join("\n") : "There's nothing in the queue!"
          }]
        }]
      });
    }
    if (embeds.length === 0) return "There's nothing in the queue!";
    return paginator(this.client, this.message, embeds);
  }

  static description = "Shows the current queue";
  static aliases = ["q"];
}

export default QueueCommand;