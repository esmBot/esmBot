import Command from "../../classes/command.js";

class SnowflakeCommand extends Command {
  async run() {
    if (!this.args[0]) return "You need to provide a snowflake ID!";
    if (!this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] < 21154535154122752n) return "That's not a valid snowflake!";
    return `<t:${Math.floor(((this.args[0].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "") / 4194304) + 1420070400000) / 1000)}:F>`;
  }

  static description = "Converts a Discord snowflake id into a timestamp";
  static aliases = ["timestamp", "snowstamp", "snow"];
  static arguments = ["[id]"];
}

export default SnowflakeCommand;
