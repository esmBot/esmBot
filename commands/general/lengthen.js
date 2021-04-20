const urlCheck = require("../../utils/urlcheck");
const fetch = require("node-fetch");
const Command = require("../../classes/command");

class LengthenCommand extends Command {
  async run() {
    this.message.channel.sendTyping();
    if (this.args.length === 0 || !urlCheck(this.args[0])) return `${this.message.author.mention}, you need to provide a short URL to lengthen!`;
    if (urlCheck(this.args[0])) {
      const url = await fetch(encodeURI(this.args[0]), { redirect: "manual" });
      return url.headers.get("location") || this.args[0];
    } else {
      return `${this.message.author.mention}, that isn't a URL!`;
    }
  }

  static description = "Lengthens a short URL";
  static aliases = ["longurl", "lengthenurl", "longuri", "lengthenuri", "unshorten"];
  static arguments = ["[url]"];
}

module.exports = LengthenCommand;