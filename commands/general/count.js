import paginator from "../../utils/pagination/pagination.js";
import * as collections from "../../utils/collections.js";
import database from "../../utils/database.js";
import Command from "../../classes/command.js";

class CountCommand extends Command {
  async run() {
    const cmd = (this.interaction?.data.options.getString("command") ?? this.args.join(" ")).trim();
    const merged = new Map([...collections.commands, ...collections.messageCommands, ...collections.userCommands]);
    if (cmd && (merged.has(cmd) || collections.aliases.has(cmd))) {
      const command = collections.aliases.get(cmd) ?? cmd;
      const counts = await database.getCounts();
      return `The command \`${command}\` has been run a total of ${counts[command]} times.`;
    }
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
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
    const groups = countArray2.map((_item, index) => {
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
            name: this.author.username,
            iconURL: this.author.avatarURL()
          }
        }]
      });
    }
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "Gets how many times every command was used";
  static aliases = ["counts"];
  static flags = [{
    name: "command",
    type: 3,
    description: "A specific command to view counts for",
    classic: true
  }];
  static dbRequired = true;
}

export default CountCommand;