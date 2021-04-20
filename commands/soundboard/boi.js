const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class BoiCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/boi.ogg", this.message);
  }

  static description = "Plays the \"boi\" sound effect";
  static aliases = ["boy", "neutron", "hugh"];
}

module.exports = BoiCommand;