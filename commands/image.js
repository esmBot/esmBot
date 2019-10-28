const { google } = require("googleapis");
const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination");
const config = require("../config.json");
const search = google.customsearch("v1");

exports.run = async (message, args) => {
  if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide something to search for!`;
  const embeds = [];
  const images = await search.cse.list({ searchType: "image", safe: "active", cx: config.cseID, q: args.join(" "), auth: config.googleKey });
  for (const [i, value] of images.data.items.entries()) {
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
  if (embeds.length === 0) return `${message.author.mention}, I couldn't find any results!`;
  return paginator(message, embeds);
};

exports.aliases = ["im", "photo", "img"];
