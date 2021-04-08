const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class BruhCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/bruh.ogg", this.message);
  }

  static description = "Plays the \"bruh\" sound effect";
  static aliases = ["bro"];
}

module.exports = BruhCommand;