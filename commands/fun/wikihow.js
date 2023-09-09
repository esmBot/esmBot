import Command from "../../classes/command.js";

class WikihowCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const req = await fetch("https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6", { signal: controller.signal });
      clearTimeout(timeout);
      const json = await req.json();
      const id = Object.keys(json.query.pages)[0];
      const data = json.query.pages[id];
      if (data.imageinfo) {
        return json.query.pages[id].imageinfo[0].url;
      } else {
        return await this.run();
      }
    } catch (e) {
      if (e.name === "AbortError") {
        this.success = false;
        return "I couldn't get a WikiHow image in time. Maybe try again?";
      }
    }
  }

  static description = "Gets a random WikiHow image";
  static aliases = ["wiki"];
}

export default WikihowCommand;
