import ImageCommand from "#cmd-classes/imageCommand.js";

class QrReadCommand extends ImageCommand {
  static description = "Reads a QR code";
  static aliases = ["qrread"];

  static requiresImage = true;
  static noImage = "You need to provide an image/GIF with a QR code to read!";
  static empty = "I couldn't find a QR code!";
  static command = "qrread";
}

export default QrReadCommand;
