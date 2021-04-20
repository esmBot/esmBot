const soundPlayer = require("../utils/soundplayer");
const MusicCommand = require("./musicCommand");

class SoundCommand extends MusicCommand {
  async run() {
    return soundPlayer.play(this.client, `./assets/audio/${this.sound}`, this.message);
  }
}

module.exports = SoundCommand;