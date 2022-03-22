import fetch from "node-fetch";
import Command from "../../classes/command.js";

class CatCommand extends Command {
  async run() {
    this.acknowledge();
    const controller = new AbortController(); // eslint-disable-line no-undef
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const data = await fetch("https://projectlounge.pw/cta/", { redirect: "manual", signal: controller.signal });
      clearTimeout(timeout);
      return {
        embeds: [{
          color: 16711680,
          image: {
            url: data.headers.get("location")
          }
        }]
      };
    } catch (e) {
      if (e.name === "AbortError") {
        return "I couldn't get a cat image in time. Maybe try again?";
      }
    }
  }

  static description = "Gets a random cat picture";
  static aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats", "cta"];
}

export default CatCommand;