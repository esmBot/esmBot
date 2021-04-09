const ImageCommand = require("../../classes/imageCommand.js");

class FunkyCommand extends ImageCommand {
  params = {
    water: "./assets/images/funky.png",
    gravity: 3,
    resize: true
  };

  static description = "Adds the New Funky Mode banner to an image";
  static aliases = ["funkymode", "newfunkymode", "funkykong"];

  static noImage = "you need to provide an image to add a New Funky Mode banner!";
  static command = "watermark";
}

module.exports = FunkyCommand;