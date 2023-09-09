import Command from "../../classes/command.js";

class BirdCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const imageData = await fetch("http://shibe.online/api/birds", { signal: controller.signal });
      clearTimeout(timeout);
      const json = await imageData.json();
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