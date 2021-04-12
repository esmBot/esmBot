const soundPlayer = require("../../utils/soundplayer.js");
const fetch = require("node-fetch");
const day = require("dayjs");
const duration = require("dayjs/plugin/duration");
day.extend(duration);
const paginator = require("../../utils/pagination/pagination.js");
const MusicCommand = require("../../classes/musicCommand.js");

class QueueCommand extends MusicCommand {
  async run() {
    if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";

    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    if (!this.message.member.voiceState.channelID) return `${this.message.author.mention}, you need to be in a voice channel first!`;
    if (!this.message.channel.guild.members.get(this.client.user.id).voiceState.channelID) return `${this.message.author.mention}, I'm not in a voice channel!`;
    if (!this.message.channel.permissionsOf(this.client.user.id).has("addReactions")) return `${this.message.author.mention}, I don't have the \`Add Reactions\` permission!`;
    if (!this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return `${this.message.author.mention}, I don't have the \`Embed Links\` permission!`;
    const queue = soundPlayer.queues.get(this.message.channel.guild.id);
    const player = this.connection;
    const tracks = await fetch(`http://${player.player.node.host}:${player.player.node.port}/decodetracks`, { method: "POST", body: JSON.stringify(queue), headers: { Authorization: player.player.node.password, "Content-Type": "application/json" } }).then(res => res.json());
    const trackList = [];
    const firstTrack = tracks.shift();
    for (const [i, track] of tracks.entries()) {
      trackList.push(`${i + 1}. ${track.info.author} - **${track.info.title}** (${track.info.isStream ? "∞" : day.duration(track.info.length).format("m:ss", { trim: false })})`);
    }
    const pageSize = 5;
    const embeds = [];
    const groups = trackList.map((item, index) => {
      return index % pageSize === 0 ? trackList.slice(index, index + pageSize) : null;
    }).filter(Boolean);
    if (groups.length === 0) groups.push("del");
    for (const [i, value] of groups.entries()) {
      embeds.push({
        "embed": {
          "author": {
            "name": "Queue",
            "icon_url": this.client.user.avatarURL
          },
          "color": 16711680,
          "footer": {
            "text": `Page ${i + 1} of ${groups.length}`
          },
          "fields": [{
            "name": "🎶 Now Playing",
            "value": `${firstTrack.info.author} - **${firstTrack.info.title}** (${firstTrack.info.isStream ? "∞" : day.duration(firstTrack.info.length).format("m:ss", { trim: false })})`
          }, {
            "name": "🔁 Looping?",
            "value": player.loop ? "Yes" : "No"
          }, {
            "name": "🗒️ Queue",
            "value": value !== "del" ? value.join("\n") : "There's nothing in the queue!"
          }]
        }
      });
    }
    if (embeds.length === 0) return `${this.message.author.mention}, there's nothing in the queue!`;
    return paginator(this.client, this.message, embeds);
  }

  static description = "Shows the current queue";
  static aliases = ["q"];
}

module.exports = QueueCommand;