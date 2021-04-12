const fetch = require("node-fetch");
const { decodeEntities } = require("../../utils/misc.js");
const paginator = require("../../utils/pagination/pagination.js");
const Command = require("../../classes/command.js");

class YouTubeCommand extends Command {
  async run() {
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide something to search for!`;
    this.message.channel.sendTyping();
    const messages = [];
    const request = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(this.args.join(" "))}&key=${process.env.GOOGLE}&maxResults=50`);
    const result = await request.json();
    if (result.error && result.error.code === 403) return `${this.message.author.mention}, I've exceeded my YouTube API search quota for the day. Check back later.`;
    for (const [i, value] of result.items.entries()) {
      if (value.id.kind === "youtube#channel") {
        messages.push(`Page ${i + 1} of ${result.items.length}\n<:youtube:637020823005167626> **${decodeEntities(value.snippet.title).replaceAll("*", "\\*")}**\nhttps://youtube.com/channel/${value.id.channelId}`);
      } else if (value.id.kind === "youtube#playlist") {
        messages.push(`Page ${i + 1} of ${result.items.length}\n<:youtube:637020823005167626> **${decodeEntities(value.snippet.title).replaceAll("*", "\\*")}**\nCreated by **${decodeEntities(value.snippet.channelTitle).replaceAll("*", "\\*")}**\nhttps://youtube.com/playlist?list=${value.id.playlistId}`);
      } else {
        messages.push(`Page ${i + 1} of ${result.items.length}\n<:youtube:637020823005167626> **${decodeEntities(value.snippet.title).replaceAll("*", "\\*")}**\nUploaded by **${decodeEntities(value.snippet.channelTitle).replaceAll("*", "\\*")}** on **${value.snippet.publishedAt.split("T")[0]}**\nhttps://youtube.com/watch?v=${value.id.videoId}`);
      }
    }
    return paginator(this.client, this.message, messages);
  }

  static description = "Searches YouTube";
  static aliases = ["yt", "video", "ytsearch"];
  static arguments = ["[query]"];
  static requires = "google";
}

module.exports = YouTubeCommand;