import Command from "#cmd-classes/command.js";
import { safeBigInt } from "#utils/misc.js";

class SnowflakeCommand extends Command {
  async run() {
    this.success = false;
    if (!this.args[0]) return this.getString("commands.responses.snowflake.noInput");
    if (!this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) || Number.parseInt(this.args[0]) < 21154535154122752n)
      return this.getString("commands.responses.snowflake.invalid");
    const baseId = safeBigInt(
      this.args[0]
        .replaceAll("@", "")
        .replaceAll("#", "")
        .replaceAll("!", "")
        .replaceAll("&", "")
        .replaceAll("<", "")
        .replaceAll(">", ""),
    );
    if (baseId === -1) throw this.getString("commands.responses.snowflake.invalid");
    const id = (baseId / 4194304n + 1420070400000n) / 1000n;
    this.success = true;
    return `<t:${id}:F>`;
  }

  static description = "Converts a Discord snowflake id into a timestamp";
  static aliases = ["timestamp", "snowstamp", "snow"];
  static flags = [
    {
      name: "id",
      type: "string",
      description: "A snowflake ID",
      classic: true,
    },
  ];
  static slashAllowed = false;
}

export default SnowflakeCommand;
