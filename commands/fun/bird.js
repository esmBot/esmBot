import { request } from "undici";
import Command from "../../classes/command.js";

class BirdCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const imageData = await request("http://shibe.online/api/birds", { signal: controller.signal });
      clearTimeout(timeout);
      const json = await imageData.body.json();
      return json[0];
    } catch (e) {
      if (e.name === "AbortError") {
        this.success = false;
        return "I couldn't get a bird image in time. Maybe try again?";
      }
    }
  }

  static description = "Gets a random bird picture";
  static aliases = ["birb", "birds", "birbs"];
}

export default BirdCommand;