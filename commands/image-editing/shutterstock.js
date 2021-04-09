const ImageCommand = require("../../classes/imageCommand.js");

class ShutterstockCommand extends ImageCommand {
  params = {
    water: "./assets/images/shutterstock.png",
    gravity: 5,
    resize: true
  };

  static description = "Adds the Shutterstock watermark to an image";
  static aliases = ["stock", "stockphoto"];

  static noImage = "you need to provide an image to add a Shutterstock watermark!";
  static command = "watermark";
}

module.exports = ShutterstockCommand;