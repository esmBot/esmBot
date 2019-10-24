const YouTube = require("simple-youtube-api");
const config = require("../config.json");
const youtube = new YouTube(config.googleKey);

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  message.channel.sendTyping();
  const result = await youtube.search(args.join(" "), 1);
  if (result[0].type === "channel") {
    return `<:youtube:637020823005167626> **${result[0].raw.snippet.title.replace("*", "\\*")}**\nhttps://youtube.com/channel/${result[0].id}`;
  } else if (result[0].type === "playlist") {
    return `<:youtube:637020823005167626> **${result[0].title.replace("*", "\\*")}**\nCreated by **${result[0].channel.title.replace("*", "\\*")}**\nhttps://youtube.com/playlist?list=${result[0].id}`;
  } else {
    return `<:youtube:637020823005167626> **${result[0].title.replace("*", "\\*")}**\nUploaded by **${result[0].channel.title.replace("*", "\\*")}** on **${result[0].publishedAt.toISOString().split("T")[0]}**\nhttps://youtube.com/watch?v=${result[0].id}`;
  }
};