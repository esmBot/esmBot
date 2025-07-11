import { Buffer } from "node:buffer";
import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { clean } from "#utils/misc.js";

class EvalCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.eval.botOwnerOnly");
    }
    await this.acknowledge();
    const code = this.getOptionString("code") ?? this.args.join(" ");
    try {
      let evaled = eval(code);
      if (process.env.PM2_USAGE && this.getOptionBoolean("broadcast")) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "eval",
            from: process.env.pm_id,
            message: code,
          },
        });
      }
      if (evaled instanceof Promise) evaled = await evaled;
      const cleaned = clean(evaled);
      const sendString = `\`\`\`js\n${cleaned}\n\`\`\``;
      if (sendString.length >= 2000) {
        return {
          content: this.getString("tooLarge"),
          files: [
            {
              contents: Buffer.from(cleaned),
              name: "result.txt",
            },
          ],
        };
      }
      return sendString;
    } catch (err) {
      return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${clean(err)}\n\`\`\``;
    }
  }

  static flags = [
    {
      name: "code",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The code to execute",
      classic: true,
      required: true,
    },
    {
      name: "broadcast",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Execute on all bot processes (only use if you know what you're doing!)",
    },
  ];

  static description = "Executes JavaScript code";
  static aliases = ["run"];
  static adminOnly = true;
}

export default EvalCommand;
