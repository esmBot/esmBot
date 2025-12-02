import MediaCommand from "#cmd-classes/mediaCommand.js";

class GIFCommand extends MediaCommand {
  static description = "Converts an image into a GIF";
  static aliases = ["gif", "getgif", "togif", "tgif", "gifify"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image to convert to GIF!";
  static command = "togif";
}

export default GIFCommand;
