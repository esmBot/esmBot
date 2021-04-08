const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class BoomCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/boom.ogg", this.message);
  }

  static description = "Plays the Vine boom sound effect";
  static aliases = ["thud", "vine"];
}

module.exports = BoomCommand;