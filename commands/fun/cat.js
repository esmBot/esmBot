import Command from "#cmd-classes/command.js";

class CatCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const data = await fetch("https://files.esmbot.net/cta", {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timeout);
      return `https://files.esmbot.net${data.headers.get("location")}`;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        this.success = false;
        return this.getString("commands.responses.cat.error");
      }
    }
  }

  static description = "Gets a random cat picture";
  static aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats", "cta"];
}

export default CatCommand;
