import ImageCommand from "#cmd-classes/imageCommand.js";

class SonicCommand extends ImageCommand {
  params() {
    const inputText = this.getOptionString("text") ?? this.args.join(" ");
    return {
      text: this.clean(inputText)
    };
  }

  static description = "Creates a Sonic speech bubble image";

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to make a Sonic meme!";
  static command = "sonic";
}

export default SonicCommand;