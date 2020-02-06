const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  const embeds = [];
  const request = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE}&cx=${process.env.CSE}&safe=active&searchType=image&q=${encodeURIComponent(args.join(" "))}`);
  const images = await request.json();
  if (images.error && images.error.code === 403) return `${message.author.mention}, the daily search quota has been exceeded. Check back later.`;
  if (!images.items) return `${message.author.mention}, I couldn't find any results!`;
  for (const [i, value] of images.items.entries()) {
    embeds.push({
      "embed": {
        "title": "Search Results",
        "color": 16711680,
        "footer": {
          "text": `Page ${i + 1} of ${images.length}`
        },
        "image": {
          "url": value.link
        },
        "author": {
          "name": message.author.username,
          "icon_url": message.author.avatarURL
        }
      }
    });
  }
  return paginator(message, embeds);
};

exports.aliases = ["im", "photo", "img"];
exports.category = 1;
exports.help = "Searches for images on Google";
exports.requires = "google";
exports.params = "[query]";