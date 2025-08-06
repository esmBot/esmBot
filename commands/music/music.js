import Command from "#cmd-classes/command.js";

class MusicCommand extends Command {
  async run() {
    this.success = false;
    return this.getString("commands.responses.music.invalid");
  }

  static description = "Handles music playback";
  static aliases = ["m"];
  static directAllowed = false;
  static userAllowed = false;
}

export default MusicCommand;
