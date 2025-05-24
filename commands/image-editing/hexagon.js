import ImageCommand from "#cmd-classes/imageCommand.js";

class HexagonCommand extends ImageCommand {
  params = {
    water: "assets/images/hexagon.png",
    resize: true,
    gravity: 1337,
    alpha: true,
    crop: true,
  };

  static description = "Turns an image into an NFT hexagon profile picture";
  static aliases = ["nft", "hexpfp"];
  
  static noImage = "You need to provide an image/GIF to hexagonify!";
  static command = "watermark";
}

export default HexagonCommand;