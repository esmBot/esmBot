const fetch = require("node-fetch");
const { searx } = require("../../servers.json");
const { random } = require("../../utils/misc.js");
const paginator = require("../../utils/pagination/pagination.js");
const Command = require("../../classes/command.js");

class YouTubeCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide something to search for!";
    this.client.sendChannelTyping(this.message.channel.id);
    const messages = [];
    const videos = await fetch(`${random(searx)}/search?format=json&safesearch=1&categories=videos&q=!youtube%20${encodeURIComponent(this.args.join(" "))}`).then(res => res.json());
    if (videos.results.length === 0) return "I couldn't find any results!";
    for (const [i, value] of videos.results.entries()) {
      messages.push({ content: `Page ${i + 1} of ${videos.results.length}\n<:youtube:637020823005167626> **${value.title.replaceAll("*", "\\*")}**\nUploaded by **${value.author.replaceAll("*", "\\*")}**\n${value.url}` });
    }
    return paginator(this.client, this.message, messages);
  }

  static description = "Searches YouTube";
  static aliases = ["yt", "video", "ytsearch"];
  static arguments = ["[query]"];
}

module.exports = YouTubeCommand;