import Command from "#cmd-classes/command.js";

class QrCommand extends Command {
  async run() {
    this.success = false;
    return this.getString("commands.responses.qr.invalid");
  }

  static description = "Generates/reads a QR code";
}

export default QrCommand;
