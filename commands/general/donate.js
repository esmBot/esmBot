import fetch from "node-fetch";
import Command from "../../classes/command.js";

class DonateCommand extends Command {
  async run() {
    this.acknowledge();
    let prefix = "";
    const controller = new AbortController(); // eslint-disable-line no-undef
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);
    try {
      const patrons = await fetch("https://projectlounge.pw/patrons", { signal: controller.signal }).then(data => data.json());
      clearTimeout(timeout);
      prefix = "Thanks to the following patrons for their support:\n";
      for (const patron of patrons) {
        prefix += `**- ${patron}**\n`;
      }
      prefix += "\n";
    } catch (e) {
      // no-op
    }
    return `${prefix}Like esmBot? Consider supporting the developer on Patreon to help keep it running! https://patreon.com/TheEssem`;
  }

  static description = "Learn more about how you can support esmBot's development";
  static aliases = ["support", "patreon", "patrons"];
}

export default DonateCommand;