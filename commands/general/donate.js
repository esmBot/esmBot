const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class DonateCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    let prefix = "";
    const patrons = await fetch("https://projectlounge.pw/patrons").then(data => data.json());
    prefix = "Thanks to the following patrons for their support:\n";
    for (const patron of patrons) {
      prefix += `**- ${patron}**\n`;
    }
    prefix += "\n";
    return `${prefix}Like esmBot? Consider supporting the developer on Patreon to help keep it running! https://patreon.com/TheEssem`;
  }

  static description = "Learn more about how you can support esmBot's development";
  static aliases = ["support", "patreon", "patrons"];
}

module.exports = DonateCommand;