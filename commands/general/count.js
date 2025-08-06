import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import paginator from "#pagination";
import * as collections from "#utils/collections.js";

class CountCommand extends Command {
  async run() {
    if (!this.database) return this.getString("noDatabase");
    const cmd = (this.getOptionString("command") ?? this.args.join(" ")).trim();
    const merged = [
      ...collections.commands.keys(),
      ...collections.messageCommands.keys(),
      ...collections.userCommands.keys(),
    ];
    if (cmd && (merged.includes(cmd) || collections.aliases.has(cmd))) {
      const command = collections.aliases.get(cmd) ?? cmd;
      const counts = await this.database.getCounts();
      return this.getString("commands.responses.count.single", {
        params: { command, count: counts.get(command)?.toString() ?? "0" },
      });
    }
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const counts = await this.database.getCounts();
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
    const groups = [];
    let arrIndex = 0;
    for (let i = 0; i < countArray2.length; i += 15) {
      groups[arrIndex] = countArray2.slice(i, i + 15);
      arrIndex++;
    }
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            title: this.getString("commands.responses.count.header"),
            color: 0xff0000,
            footer: {
              text: this.getString("pagination.page", {
                params: {
                  page: (i + 1).toString(),
                  amount: groups.length.toString(),
                },
              }),
            },
            description: value?.join("\n"),
            author: {
              name: this.author.username,
              iconURL: this.author.avatarURL(),
            },
          },
        ],
      });
    }
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  static description = "Gets how many times every command was used";
  static aliases = ["counts"];
  static flags = [
    {
      name: "command",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "A specific command to view counts for",
      classic: true,
    },
  ];
  static dbRequired = true;
}

export default CountCommand;
