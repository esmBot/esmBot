const Command = require("../../classes/command.js");

class SoundReloadCommand extends Command {
  // another very hacky command
  run() {
    return new Promise((resolve) => {
      if (this.message.author.id !== process.env.OWNER) return "Only the bot owner can reload Lavalink!";
      this.message.channel.sendTyping();
      this.ipc.broadcast("soundreload");
      this.ipc.register("soundReloadSuccess", (msg) => {
        this.ipc.unregister("soundReloadSuccess");
        this.ipc.unregister("soundReloadFail");
        resolve(`Successfully connected to ${msg.msg.length} Lavalink node(s).`);
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

module.exports = SoundReloadCommand;