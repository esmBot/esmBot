const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");
const database = require("../utils/database.js");

exports.run = async (message) => {
  if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  const counts = await database.query("SELECT * FROM counts");
  const countArray = [];
  const sortedValues = counts.rows.sort((a, b) => {
    return b.count - a.count;
  });
  for (const { command, count } of sortedValues) {
    countArray.push(`**${command}**: ${count}`);
  }
  const embeds = [];
  const groups = countArray.map((item, index) => {
    return index % 15 === 0 ? countArray.slice(index, index + 15) : null;
  }).filter((item) => {
    return item;
  });
  for (const [i, value] of groups.entries()) {
    embeds.push({
      "embed": {
        "title": "Command Usage Counts",
        "color": 16711680,
        "footer": {
          "text": `Page ${i + 1} of ${groups.length}`
        },
        "description": value.join("\n"),
        "author": {
          "name": message.author.username,
          "icon_url": message.author.avatarURL
        }
      }
    });
  }
  return paginator(message, embeds);
};

exports.category = 1;
exports.help = "Gets how many times every command was used";