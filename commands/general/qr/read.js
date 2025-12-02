import MediaCommand from "#cmd-classes/mediaCommand.js";

class QrReadCommand extends MediaCommand {
  static description = "Reads a QR code";
  static aliases = ["qrread"];

  static requiresImage = true;
  static noImage = "You need to provide an image/GIF with a QR code to read!";
  static empty = "I couldn't find a QR code!";
  static command = "qrread";
}

export default QrReadCommand;
