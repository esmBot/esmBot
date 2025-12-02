import MediaCommand from "#cmd-classes/mediaCommand.js";

class MagikCommand extends MediaCommand {
  static description = "Adds a content aware scale effect to an image";
  static aliases = ["imagemagic", "imagemagick", "imagemagik", "magic", "magick", "cas", "liquid"];

  static noImage = "You need to provide an image/GIF to add some magik!";
  static command = "magik";
}

export default MagikCommand;
