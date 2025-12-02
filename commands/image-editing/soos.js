import MediaCommand from "#cmd-classes/mediaCommand.js";

class SooSCommand extends MediaCommand {
  params = {
    soos: true,
  };

  static description = '"Loops" an image sequence by reversing it when it\'s finished';
  static aliases = ["boomerang"];

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to loop!";
  static command = "reverse";
}

export default SooSCommand;
