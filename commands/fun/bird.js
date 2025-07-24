import Command from "#cmd-classes/command.js";

class BirdCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const data = await fetch("https://files.esmbot.net/bird", {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timeout);
      return `https://files.esmbot.net${data.headers.get("location")}`;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        this.success = false;
        return this.getString("commands.responses.bird.error");
      }
    }
  }

  static description = "Gets a random bird picture";
  static aliases = ["birb", "birds", "birbs"];
}

export default BirdCommand;
