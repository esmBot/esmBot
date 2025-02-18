import paginator from "#pagination";
import * as collections from "#utils/collections.js";
import database from "#database";
import Command from "#cmd-classes/command.js";
import { Constants } from "oceanic.js";

class CountCommand extends Command {
  async run() {
    if (!database) return this.getString("noDatabase");
    const cmd = (this.getOptionString("command") ?? this.args.join(" ")).trim();
    const merged = new Map([...collections.commands, ...collections.messageCommands, ...collections.userCommands]);
    if (cmd && (merged.has(cmd) || collections.aliases.has(cmd))) {
      const command = collections.aliases.get(cmd) ?? cmd;
      const counts = await database.getCounts();
      return this.getString("commands.responses.count.single", { params: { command, count: counts[command] } });
    }
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const counts = await database.getCounts();
    const countArray = [];
    for (const entry of counts.entries()) {
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
          title: this.getString("commands.responses.count.header"),
          color: 0xff0000,
          footer: {
            text: this.getString("pagination.page", {
              params: {
                page: (i + 1).toString(),
                amount: groups.length.toString()
              }
            })
          },
          description: value?.join("\n"),
          author: {
            name: this.author.username,
            iconURL: this.author.avatarURL()
          }
        }]
      });
    }
    return paginator(this.client, { message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "Gets how many times every command was used";
  static aliases = ["counts"];
  static flags = [{
    name: "command",
    type: Constants.ApplicationCommandOptionTypes.STRING,
    description: "A specific command to view counts for",
    classic: true
  }];
  static dbRequired = true;
}

export default CountCommand;