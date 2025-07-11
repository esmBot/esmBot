import ImageCommand from "#cmd-classes/imageCommand.js";

class HomebrewCommand extends ImageCommand {
  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter((item) => !item.includes(url ?? "")).join(" ");
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
