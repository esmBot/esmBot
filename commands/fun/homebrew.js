import MediaCommand from "#cmd-classes/mediaCommand.js";

class HomebrewCommand extends MediaCommand {
  paramsFunc() {
    const newArgs = this.getOptionString("text") ?? this.args.join(" ");
    return {
      caption: this.clean(newArgs),
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    return this;
  }

  static description = "Creates a Homebrew Channel edit";
  static aliases = ["hbc", "brew", "wiibrew"];

  static requiresImage = false;
  static requiresParam = true;
  static noParam = "You need to provide some text to make a Homebrew Channel edit!";
  static command = "homebrew";
}

export default HomebrewCommand;
