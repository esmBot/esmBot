const ImageCommand = require("../../classes/imageCommand.js");

class DeviantArtCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    water: "./assets/images/deviantart.png",
    gravity: 5,
    resize: true
  };

  static description = "Adds a DeviantArt watermark to an image";
  static aliases = ["da", "deviant"];

  static noImage = "you need to provide an image to add a DeviantArt watermark!";
  static command = "watermark";
}

module.exports = DeviantArtCommand;