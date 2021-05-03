const database = require("../../utils/database.js");
const collections = require("../../utils/collections.js");
const misc = require("../../utils/misc.js");
const paginator = require("../../utils/pagination/pagination.js");
const help = require("../../utils/help.js");
const tips = ["You can change the bot's prefix using the prefix command.", "Image commands also work with images previously posted in that channel.", "You can use the tags commands to save things for later use.", "You can visit https://projectlounge.pw/esmBot/help.html for a web version of this command list.", "You can view a command's aliases by putting the command name after the help command (e.g. help image).", "Parameters wrapped in [] are required, while parameters wrapped in {} are optional.", "esmBot is hosted and paid for completely out-of-pocket by the main developer. If you want to support development, please consider donating! https://patreon.com/TheEssem"];
const Command = require("../../classes/command.js");

class HelpCommand extends Command {
  async run() {
    const { prefix } = this.message.channel.guild ? await database.getGuild(this.message.channel.guild.id) : "N/A";
    const commands = collections.commands;
    const aliases = collections.aliases;
    if (this.args.length !== 0 && (commands.has(this.args[0].toLowerCase()) || aliases.has(this.args[0].toLowerCase()))) {
      const command = aliases.has(this.args[0].toLowerCase()) ? collections.aliases.get(this.args[0].toLowerCase()) : this.args[0].toLowerCase();
      const info = collections.info.get(command);
      const counts = await database.getCounts();
      /*const counts = countDB.reduce((acc, val) => {
        const [key, value] = val;
        acc[key] = value;
        return acc;
      }, {});*/
      const embed = {
        "embed": {
          "author": {
            "name": "esmBot Help",
            "icon_url": this.client.user.avatarURL
          },
          "title": `${this.message.channel.guild ? prefix : ""}${command}`,
          "url": "https://projectlounge.pw/esmBot/help.html",
          "description": command === "tags" ? "The main tags command. Check the help page for more info: https://projectlounge.pw/esmBot/help.html" : info.description,
          "color": 16711680,
          "fields": [{
            "name": "Aliases",
            "value": info.aliases.length !== 0 ? info.aliases.join(", ") : "None"
          }, {
            "name": "Times Used",
            "value": counts[command],
            "inline": true
          }, {
            "name": "Parameters",
            "value": command === "tags" ? "[name]" : (info.params ? (info.params.length !== 0 ? info.params.join(" ") : "None") : "None"),
            "inline": true
          }]
        }
      };
      return embed;
    } else {
      const pages = [];
      for (const category of Object.keys(help.categories)) {
        const splitPages = help.categories[category].map((item, index) => {
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
          "embed": {
            "author": {
              "name": "esmBot Help",
              "icon_url": this.client.user.avatarURL
            },
            "title": value.title,
            "description": value.page.join("\n"),
            "color": 16711680,
            "footer": {
              "text": `Page ${i + 1} of ${pages.length}`
            },
            "fields": [{
              "name": "Prefix",
              "value": this.message.channel.guild ? prefix : "N/A"
            }, {
              "name": "Tip",
              "value": misc.random(tips)
            }]
          }
        });
      }
      return paginator(this.client, this.message, embeds);
    }
  }

  static description = "Gets a list of commands";
  static aliases = ["commands"];
  static arguments = ["{command}"];
}

module.exports = HelpCommand;