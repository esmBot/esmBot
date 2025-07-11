import ImageCommand from "#cmd-classes/imageCommand.js";

class SonicCommand extends ImageCommand {
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

  static description = "Creates a Sonic speech bubble image";

  static requiresImage = false;
  static requiresParam = true;
  static noParam = "You need to provide some text to make a Sonic meme!";
  static command = "sonic";
}

export default SonicCommand;
