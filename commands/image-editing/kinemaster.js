import ImageCommand from "#cmd-classes/imageCommand.js";

class KineMasterCommand extends ImageCommand {
  params = {
    water: "assets/images/kinemaster.png",
    gravity: 3,
    resize: true
  };

  static description = "Adds the KineMaster watermark to an image";
  static aliases = ["kine"];

  static noImage = "You need to provide an image/GIF to add a KineMaster watermark!";
  static command = "watermark";
}

export default KineMasterCommand;
