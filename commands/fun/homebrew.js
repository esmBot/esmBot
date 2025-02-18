import ImageCommand from "#cmd-classes/imageCommand.js";

class HomebrewCommand extends ImageCommand {
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: this.clean(newArgs)
    };
  }

  static description = "Creates a Homebrew Channel edit";
  static aliases = ["hbc", "brew", "wiibrew"];

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to make a Homebrew Channel edit!";
  static command = "homebrew";
}

export default HomebrewCommand;