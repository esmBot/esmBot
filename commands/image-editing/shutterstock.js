import ImageCommand from "../../classes/imageCommand.js";

class ShutterstockCommand extends ImageCommand {
  params = {
    water: "./assets/images/shutterstock.png",
    gravity: 5,
    resize: true
  };

  static description = "Adds the Shutterstock watermark to an image";
  static aliases = ["stock", "stockphoto"];

  static noImage = "You need to provide an image to add a Shutterstock watermark!";
  static command = "watermark";
}

export default ShutterstockCommand;