import ImageCommand from "#cmd-classes/imageCommand.js";

class WatermarkPowerDirectorCommand extends ImageCommand {
  params = {
    water: "assets/images/powerdirector.png",
    gravity: 9,
    resize: true,
  };

  static description = "Adds the PowerDirector watermark to an image";
  static aliases = ["powerdirector", "cyberlink"];

  static noImage = "You need to provide an image/GIF to add a PowerDirector watermark!";
  static command = "watermark";
}

export default WatermarkPowerDirectorCommand;
