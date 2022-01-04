import Command from "../../classes/command.js";

class ReloadCommand extends Command {
  // quite possibly one of the hackiest commands in the bot
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.message.author.id)) return resolve("Only the bot owner can reload commands!");
      if (this.args.length === 0) return resolve("You need to provide a command to reload!");
      this.ipc.broadcast("reload", this.args[0]);
      this.ipc.register("reloadSuccess", () => {
        this.ipc.unregister("reloadSuccess");
        this.ipc.unregister("reloadFail");
        resolve(`The command \`${this.args[0]}\` has been reloaded.`);
      });
      this.ipc.register("reloadFail", (message) => {
        this.ipc.unregister("reloadSuccess");
        this.ipc.unregister("reloadFail");
        resolve(message.result);
      });
    });
  }

  static description = "Reloads a command";
  static arguments = ["[command]"];
}

export default ReloadCommand;
