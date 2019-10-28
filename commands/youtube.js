const { google } = require("googleapis");
const config = require("../config.json");
const youtube = google.youtube({
  version: "v3",
  auth: config.googleKey,
});

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  message.channel.sendTyping();
  const result = await youtube.search.list({ q: args.join(" "), part: "snippet" });
  if (result.data.items[0].id.kind === "youtube#channel") {
    return `<:youtube:637020823005167626> **${result.data.items[0].snippet.title.replace("*", "\\*")}**\nhttps://youtube.com/channel/${result.data.items[0].id.channelId}`;
  } else if (result.data.items[0].id.kind === "youtube#playlist") {
    return `<:youtube:637020823005167626> **${result.data.items[0].snippet.title.replace("*", "\\*")}**\nCreated by **${result.data.items[0].snippet.channelTitle.replace("*", "\\*")}**\nhttps://youtube.com/playlist?list=${result.data.items[0].id.playlistId}`;
  } else {
    return `<:youtube:637020823005167626> **${result.data.items[0].snippet.title.replace("*", "\\*")}**\nUploaded by **${result.data.items[0].snippet.channelTitle.replace("*", "\\*")}** on **${result.data.items[0].snippet.publishedAt.split("T")[0]}**\nhttps://youtube.com/watch?v=${result.data.items[0].id.videoId}`;
  }
};

exports.aliases = ["yt", "video", "ytsearch"];