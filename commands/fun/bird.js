import Command from "../../classes/command.js";

class BirdCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const data = await fetch("https://files.projectlounge.pw/bird/", { method: "HEAD", signal: controller.signal, redirect: "manual" });
      clearTimeout(timeout);
      return `https://files.projectlounge.pw${data.headers.get("location")}`;
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