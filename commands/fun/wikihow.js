import Command from "#cmd-classes/command.js";

class WikihowCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const req = await fetch(
        "https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6",
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      const json = await req.json();
      const id = Object.keys(json.query.pages)[0];
      return json.query.pages[id].imageinfo[0].url;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        this.success = false;
        return this.getString("commands.responses.wikihow.error");
      }
    }
  }

  static description = "Gets a random WikiHow image";
  static aliases = ["wiki"];
}

export default WikihowCommand;
