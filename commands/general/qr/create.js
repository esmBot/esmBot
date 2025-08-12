import ImageCommand from "#cmd-classes/imageCommand.js";

class QrCreateCommand extends ImageCommand {
  paramsFunc() {
    const inputText = this.getOptionString("text") ?? this.args.join(" ");
    return {
      text: this.clean(inputText),
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    return this;
  }

  static description = "Generates a QR code";
  static aliases = ["qrcreate"];

  static requiresImage = false;
  static requiresParam = true;
  static noParam = "You need to provide some text to generate a QR code!";
  static command = "qrcreate";
}

export default QrCreateCommand;
