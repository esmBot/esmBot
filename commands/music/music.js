import Command from "#cmd-classes/command.js";

class MusicCommand extends Command {
  static description = "Handles music playback";
  static aliases = ["m"];
  static directAllowed = false;
  static userAllowed = false;
}

export default MusicCommand;
