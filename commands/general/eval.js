import { Buffer } from "node:buffer";
import Command from "#cmd-classes/command.js";
import { sendIPCMessage } from "#utils/ipc.js";
import { getEnv } from "#utils/runtime.js";
import { clean } from "#utils/sanitize.js";
/** @import { CommandFlag } from "#utils/types.js" */

class EvalCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.eval.botOwnerOnly");
    }
    await this.acknowledge();
    const code = this.getOptionString("code") ?? this.args.join(" ");
    try {
      // oxlint-disable-next-line no-eval
      let evaled = eval(code);
      if (this.getOptionBoolean("broadcast")) {
        sendIPCMessage("eval", code);
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

  /** @type {CommandFlag[]} */
  static flags = [
    {
      name: "code",
      type: "string",
      description: "The code to execute",
      classic: true,
      required: true,
    },
    {
      name: "broadcast",
      type: "boolean",
      description: "Execute on all bot processes (only use if you know what you're doing!)",
    },
  ];

  static description = "Executes JavaScript code";
  static aliases = ["run"];
  static adminOnly = true;
}

export default EvalCommand;
