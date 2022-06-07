import Command from "../../classes/command.js";

class ReloadCommand extends Command {
  // quite possibly one of the hackiest commands in the bot
  run() {
    return new Promise((resolve) => {
      const owners = process.env.OWNER.split(",");
      if (!owners.includes(this.author.id)) return resolve("Only the bot owner can reload commands!");
      const commandName = this.options.cmd ?? this.args.join(" ");
      if (!commandName || !commandName.trim()) return resolve("You need to provide a command to reload!");
      this.acknowledge().then(() => {
        this.ipc.broadcast("reload", commandName);
        this.ipc.register("reloadSuccess", () => {
          this.ipc.unregister("reloadSuccess");
          this.ipc.unregister("reloadFail");
          resolve(`The command \`${commandName}\` has been reloaded.`);
        });
        this.ipc.register("reloadFail", (message) => {
          this.ipc.unregister("reloadSuccess");
          this.ipc.unregister("reloadFail");
          resolve(message.result);
        });
      });
    });
  }

  static flags = [{
    name: "cmd",
    type: 3,
    description: "The command to reload",
    required: true
  }];

  static description = "Reloads a command";
  static arguments = ["[command]"];
}

export default ReloadCommand;
