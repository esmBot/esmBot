import Command from "#cmd-classes/command.js";

class DogCommand extends Command {
  async run() {
    await this.acknowledge();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const imageData = await fetch("https://dog.ceo/api/breeds/image/random", { signal: controller.signal });
      clearTimeout(timeout);
      const json = await imageData.json();
      return json.message;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        this.success = false;
        return this.getString("commands.responses.dog.error");
      }
    }
  }

  static description = "Gets a random dog picture";
  static aliases = ["doggos", "doggo", "pupper", "puppers", "dogs", "puppy", "puppies", "pups", "pup"];
}

export default DogCommand;
