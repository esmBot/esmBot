const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  message.channel.sendTyping();
  const request = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args.join(" "))}&key=${process.env.GOOGLE}`);
  const result = await request.json();
  if (result.items[0].id.kind === "youtube#channel") {
    return `<:youtube:637020823005167626> **${result.items[0].snippet.title.replace("*", "\\*")}**\nhttps://youtube.com/channel/${result.items[0].id.channelId}`;
  } else if (result.items[0].id.kind === "youtube#playlist") {
    return `<:youtube:637020823005167626> **${result.items[0].snippet.title.replace("*", "\\*")}**\nCreated by **${result.items[0].snippet.channelTitle.replace("*", "\\*")}**\nhttps://youtube.com/playlist?list=${result.items[0].id.playlistId}`;
  } else {
    return `<:youtube:637020823005167626> **${result.items[0].snippet.title.replace("*", "\\*")}**\nUploaded by **${result.items[0].snippet.channelTitle.replace("*", "\\*")}** on **${result.items[0].snippet.publishedAt.split("T")[0]}**\nhttps://youtube.com/watch?v=${result.items[0].id.videoId}`;
  }
};

exports.aliases = ["yt", "video", "ytsearch"];
exports.category = 1;
exports.help = "Searches YouTube";
exports.requires = "google";
exports.params = "[query]";