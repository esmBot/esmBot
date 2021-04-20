const MusicCommand = require("../../classes/musicCommand");
const soundPlayer = require("../../utils/soundplayer");

class RemoteSoundCommand extends MusicCommand {
  async run() {
    return soundPlayer.play(this.client, this.args[0], this.message);
  }
  static description = "Plays a sound from a remote file";
  static aliases = [];
}

module.exports = RemoteSoundCommand;