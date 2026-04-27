import Command from "#cmd-classes/command.js";
import { BASE_URL, images } from "./skuub.js";

class GetSkuubCommand extends Command {
  async run() {
    const hardcoded = images.map((f) => `${BASE_URL}${f}`);
    const fromDb = this.database ? await this.database.getSkuubImages() : [];
    const all = [...hardcoded, ...fromDb];
    const contents = Buffer.from(all.join("\n"), "utf-8");
    return {
      files: [{ contents, name: "skuub-urls.txt" }],
    };
  }

  static description = "Sends a text file with all skuub gif URLs";
}

export default GetSkuubCommand;
