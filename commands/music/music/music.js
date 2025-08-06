import Command from "#cmd-classes/command.js";

class MusicMusicCommand extends Command {
  async run() {
    return "https://esmbot.net/robotdance.gif";
  }

  static directAllowed = false;
  static userAllowed = false;
  static slashAllowed = false;
}

export default MusicMusicCommand;
