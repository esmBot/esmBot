import MediaCommand from "#cmd-classes/mediaCommand.js";

class PetpetCommand extends MediaCommand {
  static description = "Adds a hand petting the image";
  static aliases = ["pet", "pat", "patpat"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to pet!";
  static command = "petpet";
}

export default PetpetCommand;
