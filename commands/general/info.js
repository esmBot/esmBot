const { version } = require("../../package.json");
const Command = require("../../classes/command");

class InfoCommand extends Command {
  async run() {
    return {
      "embed": {
        "color": 16711680,
        "author": {
          "name": "esmBot Info/Credits",
          "icon_url": this.client.user.avatarURL
        },
        "fields": [{
          "name": "ℹ️ Version:",
          "value": `v${version}${process.env.NODE_ENV === "development" ? "-dev" : ""}`
        },
        {
          "name": "📝 Credits:",
          "value": "Bot by **[Essem](https://essem.space)** and **[various contributors](https://github.com/esmBot/esmBot/graphs/contributors)**\nIcon by **[MintBorrow](https://mintborrow.newgrounds.com)**"
        },
        {
          "name": "💬 Total Servers:",
          "value": this.client.guilds.size
        },
        {
          "name": "✅ Official Server:",
          "value": "[Click here!](https://projectlounge.pw/support)"
        },
        {
          "name": "💻 Source Code:",
          "value": "[Click here!](https://github.com/esmBot/esmBot)"
        },
        {
          "name": "🐦 Twitter:",
          "value": "[Click here!](https://twitter.com/esmBot_)"
        }
        ]
      }
    };
  }

  static description = "Gets some info and credits about me";
  static aliases = ["botinfo", "credits"];
}

module.exports = InfoCommand;