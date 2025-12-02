import MediaCommand from "#cmd-classes/mediaCommand.js";

class WatermarkDeviantArtCommand extends MediaCommand {
  params = {
    water: "assets/images/deviantart.png",
    gravity: 5,
    resize: true,
  };

  static description = "Adds a DeviantArt watermark to an image";
  static aliases = ["deviantart", "da", "deviant"];

  static noImage = "You need to provide an image/GIF to add a DeviantArt watermark!";
  static command = "watermark";
}

export default WatermarkDeviantArtCommand;
