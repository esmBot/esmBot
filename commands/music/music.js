import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { aliases, categories, commands, info } from "#utils/collections.js";
import { getAllLocalizations } from "#utils/i18n.js";

// all-in-one music command
class MusicAIOCommand extends Command {
  async run() {
    let cmd = this.type === "classic" ? this.args[0] : this.interaction?.data.options.getSubCommand()?.[0];
    if (!cmd) return this.getString("commands.responses.music.invalid");
    // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
    if (cmd === "music" || this.constructor.aliases.includes(cmd)) return "https://esmbot.net/robotdance.gif";
    await this.acknowledge();
    if (this.type === "classic") {
      if (!("args" in this.origOptions)) throw Error("Missing args in classic command");
      this.origOptions.args.shift();
    } else {
      if (!this.interaction) throw Error("Missing interaction in application command");
      const rawOptions = this.interaction.data.options.raw[0];
      if (rawOptions.type !== Constants.ApplicationCommandOptionTypes.SUB_COMMAND) throw Error("Subcommand not found");
      this.interaction.data.options.raw = rawOptions.options ?? [];
    }
    cmd = aliases.get(cmd) ?? cmd;
    const command = commands.get(cmd);
    if (command && info.get(cmd)?.category === "music") {
      const inst = new command(this.client, this.database, this.origOptions);
      const result = await inst.run();
      this.success = inst.success;
      return result;
    }
    this.success = false;
    return this.getString("commands.responses.music.invalid");
  }

  static postInit() {
    this.flags = [];
    const category = categories.get("music");
    if (!category) throw Error("Music category not found");
    for (const cmd of category) {
      if (cmd === "music") continue;
      const cmdInfo = info.get(cmd);
      if (!cmdInfo) throw Error(`Command info missing for ${cmd}`);
      this.flags.push({
        name: cmd,
        nameLocalizations: getAllLocalizations(`commands.names.${cmd}`),
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        description: cmdInfo.description,
        descriptionLocalizations: getAllLocalizations(`commands.descriptions.${cmd}`),
        options: cmdInfo.flags,
      });
    }
    return this;
  }

  static description = "Handles music playback";
  static aliases = ["m"];
  static directAllowed = false;
  static userAllowed = false;
}

export default MusicAIOCommand;
