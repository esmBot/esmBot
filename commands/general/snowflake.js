import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class SnowflakeCommand extends Command {
  async run() {
    this.success = false;
    if (!this.args[0]) return this.getString("commands.responses.snowflake.noInput");
    if (!this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) || Number.parseInt(this.args[0]) < 21154535154122752n)
      return this.getString("commands.responses.snowflake.invalid");
    const id = Math.floor(
      (Number(
        this.args[0]
          .replaceAll("@", "")
          .replaceAll("#", "")
          .replaceAll("!", "")
          .replaceAll("&", "")
          .replaceAll("<", "")
          .replaceAll(">", ""),
      ) /
        4194304 +
        1420070400000) /
        1000,
    );
    if (Number.isNaN(id)) return this.getString("commands.responses.snowflake.invalid");
    this.success = true;
    return `<t:${id}:F>`;
  }

  static description = "Converts a Discord snowflake id into a timestamp";
  static aliases = ["timestamp", "snowstamp", "snow"];
  static flags = [
    {
      name: "id",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "A snowflake ID",
      classic: true,
    },
  ];
  static slashAllowed = false;
}

export default SnowflakeCommand;
