const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");
const { image_search } = require("duckduckgo-images-api");

exports.run = async (message, args) => {
  if (message.channel.guild && !message.channel.guild.members.get(client.user.id).permissions.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (message.channel.guild && !message.channel.guild.members.get(client.user.id).permissions.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  const embeds = [];
  const images = await image_search({ query: args.join(" "), moderate: true });
  if (images.error && images.error.code === 403) return `${message.author.mention}, the daily search quota has been exceeded. Check back later.`;
  if (images.length === 0) return `${message.author.mention}, I couldn't find any results!`;
  for (const [i, value] of images.entries()) {
    embeds.push({
      "embed": {
        "title": "Search Results",
        "color": 16711680,
        "footer": {
          "text": `Page ${i + 1} of ${images.length}`
        },
        "image": {
          "url": value.image
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
exports.help = "Searches for images on DuckDuckGo";
exports.params = "[query]";