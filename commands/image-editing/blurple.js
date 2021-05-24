const ImageCommand = require("../../classes/imageCommand.js");

class BlurpleCommand extends ImageCommand {
  params(args) {
    return {
      old: args.length !== 0 && args[0].toLowerCase() === "old" ? true : false
    };
  }
  
  static description = "Turns an image blurple";
  static arguments = ["{old}"];

  static noImage = "You need to provide an image to make blurple!";
  static command = "blurple";
  static aliases = ["blurp"];
}

module.exports = BlurpleCommand;