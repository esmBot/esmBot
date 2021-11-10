import paginator from "../../utils/pagination/pagination.js";
import database from "../../utils/database.js";
import Command from "../../classes/command.js";

class CountCommand extends Command {
  async run() {
    if (this.message.channel.guild && !this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return "I don't have the `Embed Links` permission!";
    const counts = await database.getCounts();
    const countArray = [];
    for (const entry of Object.entries(counts)) {
      countArray.push(entry);
    }
    const sortedValues = countArray.sort((a, b) => {
      return b[1] - a[1];
    });
    const countArray2 = [];
    for (const [key, value] of sortedValues) {
      countArray2.push(`**${key}**: ${value}`);
    }
    const embeds = [];
    const groups = countArray2.map((item, index) => {
      return index % 15 === 0 ? countArray2.slice(index, index + 15) : null;
    }).filter((item) => {
      return item;
    });
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [{
          title: "Command Usage Counts",
          color: 16711680,
          footer: {
            text: `Page ${i + 1} of ${groups.length}`
          },
          description: value.join("\n"),
          author: {
            name: this.message.author.username,
            icon_url: this.message.author.avatarURL
          }
        }]
      });
    }
    return paginator(this.client, this.message, embeds);
  }

  static description = "Gets how many times every command was used";
  static arguments = ["{mention/id}"];
}

export default CountCommand;