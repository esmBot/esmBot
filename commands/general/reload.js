import Command from "../../classes/command.js";
import { load } from "../../utils/handler.js";
import { paths } from "../../utils/collections.js";

class ReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) return "Only the bot owner can reload commands!";
    const commandName = this.options.cmd ?? this.args.join(" ");
    if (!commandName || !commandName.trim()) return "You need to provide a command to reload!";
    await this.acknowledge();
    const path = paths.get(commandName);
    if (!path) return "I couldn't find that command!";
    const result = await load(this.client, path);
    if (result !== commandName) return "I couldn't reload that command!";
    if (process.env.PM2_USAGE) {
      process.send?.({
        type: "process:msg",
        data: {
          type: "reload",
          message: commandName
        }
      });
    }
    return `The command \`${commandName}\` has been reloaded.`;
  }

  static flags = [{
    name: "cmd",
    type: 3,
    description: "The command to reload",
    classic: true,
    required: true
  }];

  static description = "Reloads a command";
  static adminOnly = true;
}

export default ReloadCommand;
