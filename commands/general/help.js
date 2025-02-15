import { Constants } from "oceanic.js";
import database from "#database";
import * as collections from "#utils/collections.js";
import paginator from "#pagination";
import * as help from "#utils/help.js";
import Command from "#cmd-classes/command.js";

class HelpCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    let prefix;
    if (this.guild && database) {
      prefix = (await database.getGuild(this.guild.id)).prefix;
    } else {
      prefix = process.env.PREFIX ?? "&";
    }
    if (this.args.length !== 0 && (collections.commands.has(this.args[0].toLowerCase()) || collections.aliases.has(this.args[0].toLowerCase()))) {
      const command = collections.aliases.get(this.args[0].toLowerCase()) ?? this.args[0].toLowerCase();
      const info = collections.info.get(command);
      if (!info) return this.getString("commands.responses.help.noInfo");
      const params = info.params.filter((v) => typeof v === "string");
      const embed = {
        embeds: [{
          author: {
            name: this.getString("commands.responses.help.header"),
            iconURL: this.client.user.avatarURL()
          },
          title: `${this.guild ? prefix : ""}${command}`,
          url: "https://esmbot.net/help.html",
          description: info.description,
          color: 0xff0000,
          fields: [{
            name: this.getString("commands.responses.help.aliases"),
            value: info.aliases.length !== 0 ? info.aliases.join(", ") : this.getString("commands.responses.help.none")
          }, {
            name: this.getString("commands.responses.help.parameters"),
            value: command === "tags" ? `[${this.getString("commands.responses.help.name")}]` : (params ? (params.length !== 0 ? params.join(" ") : this.getString("commands.responses.help.none")) : this.getString("commands.responses.help.none")),
            inline: true
          }]
        }]
      };
      if (database) {
        embed.embeds[0].fields.push({
          name: this.getString("commands.responses.help.timesUsed"),
          value: (await database.getCounts())[command],
          inline: true
        });
      }
      if (info.flags.length !== 0) {
        const flagInfo = [];
        for (const flag of info.flags) {
          if (flag.type === 1) continue;
          flagInfo.push(`\`--${flag.name}${flag.type ? `=[${Constants.ApplicationCommandOptionTypes[flag.type]}]` : ""}\` - ${flag.description}`);
        }
        if (flagInfo.length !== 0) {
          embed.embeds[0].fields.push({
            name: this.getString("commands.responses.help.flags"),
            value: flagInfo.join("\n")
          });
        }
      }
      return embed;
    }
    const pages = [];
    if (help.categories === help.categoryTemplate && !help.generated) help.generateList();
    for (const category of Object.keys(help.categories)) {
      const splitPages = help.categories[category].map((_item, index) => {
        return index % 15 === 0 ? help.categories[category].slice(index, index + 15) : null;
      }).filter((item) => {
        return item;
      });
      const categoryStringArray = category.split("-");
      for (const index of categoryStringArray.keys()) {
        categoryStringArray[index] = categoryStringArray[index].charAt(0).toUpperCase() + categoryStringArray[index].slice(1);
      }
      for (const page of splitPages) {
        pages.push({
          title: categoryStringArray.join(" "),
          page: page
        });
      }
    }
    const embeds = [];
    for (const [i, value] of pages.entries()) {
      embeds.push({
        embeds: [{
          author: {
            name: this.getString("commands.responses.help.header"),
            url: "https://esmbot.net/help.html",
            iconURL: this.client.user.avatarURL()
          },
          title: value.title,
          description: value.page?.join("\n"),
          color: 0xff0000,
          footer: {
            text: this.getString("pagination.page", {
              params: {
                page: (i + 1).toString(),
                amount: pages.length.toString()
              }
            })
          },
          fields: [{
            name: this.getString("commands.responses.help.prefix"),
            value: prefix
          }]
        }]
      });
    }
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "Gets a list of commands";
  static aliases = ["commands"];
  static flags = [{
    name: "command",
    type: Constants.ApplicationCommandOptionTypes.STRING,
    description: "A command to view info about",
    classic: true
  }];
  static slashAllowed = false;
}

export default HelpCommand;
