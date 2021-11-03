import Command from "../../classes/command.js";

class BroadcastCommand extends Command {
  // yet another very hacky command
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.message.author.id)) return "Only the bot owner can broadcast messages!";
      if (this.args.length !== 0) {
        this.ipc.broadcast("playbroadcast", this.args.join(" "));
        this.ipc.register("broadcastSuccess", () => {
          this.ipc.unregister("broadcastSuccess");
          resolve("Successfully broadcasted message.");
        });
      } else {
        this.ipc.broadcast("broadcastend");
        this.ipc.register("broadcastEnd", () => {
          this.ipc.unregister("broadcastEnd");
          resolve("Successfully ended broadcast.");
        });
      }
    });
  }

  static description = "Broadcasts a playing message until the command is run again or the bot restarts";
}

export default BroadcastCommand;