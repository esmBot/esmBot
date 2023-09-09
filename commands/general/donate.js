import Command from "../../classes/command.js";
import logger from "../../utils/logger.js";

class DonateCommand extends Command {
  async run() {
    await this.acknowledge();
    let prefix = "";
    const controller = new AbortController();
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
      logger.error(`Unable to get patron data: ${e}`);
    }
    return `${prefix}Like esmBot? Consider supporting the developer on Patreon to help keep it running! https://patreon.com/TheEssem`;
  }

  static description = "Learn more about how you can support esmBot's development";
  static aliases = ["support", "patreon", "patrons"];
}

export default DonateCommand;