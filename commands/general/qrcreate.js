import ImageCommand from "../../classes/imageCommand.js";

class QrCreateCommand extends ImageCommand {
  params() {
    const inputText = this.getOptionString("text") ?? this.args.join(" ");
    return {
      text: this.clean(inputText)
    };
  }

  static description = "Generates a QR code";

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to generate a QR code!";
  static command = "qrcreate";
}

export default QrCreateCommand;