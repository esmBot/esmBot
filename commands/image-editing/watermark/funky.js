import ImageCommand from "#cmd-classes/imageCommand.js";

class WatermarkFunkyCommand extends ImageCommand {
  params = {
    water: "assets/images/funky.png",
    gravity: 3,
    resize: true,
  };

  static description = "Adds the New Funky Mode banner to an image";
  static aliases = ["funky", "funkymode", "newfunkymode", "funkykong"];

  static noImage = "You need to provide an image/GIF to add a New Funky Mode banner!";
  static command = "watermark";
}

export default WatermarkFunkyCommand;
