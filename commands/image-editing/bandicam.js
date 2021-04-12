const ImageCommand = require("../../classes/imageCommand.js");

class BandicamCommand extends ImageCommand {
  params = {
    water: "./assets/images/bandicam.png",
    gravity: 2,
    resize: true
  };

  static description = "Adds the Bandicam watermark to an image";
  static aliases = ["bandi"];

  static noImage = "you need to provide an image to add a Bandicam watermark!";
  static command = "watermark";
}

module.exports = BandicamCommand;