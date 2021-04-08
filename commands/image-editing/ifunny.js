const ImageCommand = require("../../classes/imageCommand.js");

class iFunnyCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    water: "./assets/images/ifunny.png",
    gravity: 8,
    resize: true,
    append: true
  };

  static description = "Adds the iFunny watermark to an image";

  static noImage = "you need to provide an image to add an iFunny watermark!";
  static command = "watermark";
}

module.exports = iFunnyCommand;