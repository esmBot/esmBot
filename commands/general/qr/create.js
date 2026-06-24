import MediaCommand from "#cmd-classes/mediaCommand.js";

const textEncoder = new TextEncoder();

class QrCreateCommand extends MediaCommand {
  async criteria(text) {
    if (textEncoder.encode(text).length > 2952) return false;
    return true;
  }

  paramsFunc() {
    const inputText = this.getOptionString("text") ?? this.args.join(" ");
    return {
      text: this.clean(inputText),
    };
  }

  static init() {
    super.init();
    this.addTextParam(2952);
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
