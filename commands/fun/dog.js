import Command from "../../classes/command.js";

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
      if (e.name === "AbortError") {
        this.success = false;
        return "I couldn't get a dog image in time. Maybe try again?";
      }
    }
  }

  static description = "Gets a random dog picture";
  static aliases = ["doggos", "doggo", "pupper", "puppers", "dogs", "puppy", "puppies", "pups", "pup"];
}

export default DogCommand;