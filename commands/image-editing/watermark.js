import Command from "#cmd-classes/command.js";

class WatermarkCommand extends Command {
  async run() {
    this.success = false;
    return this.getString("commands.responses.watermark.invalid");
  }

  static description = "Applies a watermark to an image";
}

export default WatermarkCommand;
