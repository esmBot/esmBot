import Command from "../../classes/command.js";

class SnowflakeCommand extends Command {
  async run() {
    this.success = false;
    if (!this.args[0]) return "You need to provide a snowflake ID!";
    if (!this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] < 21154535154122752n) return "That's not a valid snowflake!";
    const id = Math.floor(((this.args[0].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "") / 4194304) + 1420070400000) / 1000);
    if (Number.isNaN(id)) return "That's not a valid snowflake!";
    this.success = true;
    return `<t:${id}:F>`;
  }

  static description = "Converts a Discord snowflake id into a timestamp";
  static aliases = ["timestamp", "snowstamp", "snow"];
  static flags = [{
    name: "id",
    type: 3,
    description: "A snowflake ID",
    classic: true
  }];
  static slashAllowed = false;
}

export default SnowflakeCommand;
