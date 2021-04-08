const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class BoiCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/boi.ogg", this.message);
  }

  static description = "Plays the \"boi\" sound effect";
  static aliases = ["boy", "neutron", "hugh"];
}

module.exports = BoiCommand;