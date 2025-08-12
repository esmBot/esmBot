import ImageCommand from "#cmd-classes/imageCommand.js";

class WatermarkiFunnyCommand extends ImageCommand {
  params = {
    water: "assets/images/ifunny.png",
    gravity: 8,
    resize: true,
    append: true,
  };

  static description = "Adds the iFunny watermark to an image";
  static aliases = ["ifunny"];

  static noImage = "You need to provide an image/GIF to add an iFunny watermark!";
  static command = "watermark";
}

export default WatermarkiFunnyCommand;
