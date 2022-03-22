import Command from "../../classes/command.js";

class SoundReloadCommand extends Command {
  // another very hacky command
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.message.author.id)) return "Only the bot owner can reload Lavalink!";
      this.acknowledge();
      this.ipc.broadcast("soundreload");
      this.ipc.register("soundReloadSuccess", (msg) => {
        this.ipc.unregister("soundReloadSuccess");
        this.ipc.unregister("soundReloadFail");
        resolve(`Successfully connected to ${msg.length} Lavalink node(s).`);
      });
      this.ipc.register("soundReloadFail", () => {
        this.ipc.unregister("soundReloadSuccess");
        this.ipc.unregister("soundReloadFail");
        resolve("I couldn't connect to any Lavalink nodes!");
      });
    });
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
}

export default SoundReloadCommand;