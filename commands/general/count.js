const paginator = require("../../utils/pagination/pagination.js");
const database = require("../../utils/database.js");
const Command = require("../../classes/command.js");

class CountCommand extends Command {
  async run() {
    if (this.message.channel.guild && !this.message.channel.guild.members.get(this.client.user.id).permissions.has("addReactions") && !this.message.channel.permissionsOf(this.client.user.id).has("addReactions")) return `${this.message.author.mention}, I don't have the \`Add Reactions\` permission!`;
    if (this.message.channel.guild && !this.message.channel.guild.members.get(this.client.user.id).permissions.has("embedLinks") && !this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return `${this.message.author.mention}, I don't have the \`Embed Links\` permission!`;
    const counts = await database.getCounts();
    const countArray = [];
    const sortedValues = counts.sort((a, b) => {
      return b[1] - a[1];
    });
    for (const [key, value] of sortedValues) {
      countArray.push(`**${key}**: ${value}`);
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
            "name": this.message.author.username,
            "icon_url": this.message.author.avatarURL
          }
        }
      });
    }
    return paginator(this.client, this.message, embeds);
  }

  static description = "Gets how many times every command was used";
  static arguments = ["{mention/id}"];
}

module.exports = CountCommand;