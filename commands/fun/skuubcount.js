import Command from "#cmd-classes/command.js";

const HARDCODED_COUNT = 103;

class SkuubCountCommand extends Command {
  async run() {
    const dbCount = this.database ? (await this.database.getSkuubImages()).length : 0;
    const total = HARDCODED_COUNT + dbCount;
    return `📦 Skuub pool: **${total}** images (${HARDCODED_COUNT} classic + ${dbCount} added)`;
  }

  static description = "Shows how many images are in the skuub pool";
}

export default SkuubCountCommand;
