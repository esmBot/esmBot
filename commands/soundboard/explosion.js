const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class ExplosionCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/explosion.ogg", this.message);
  }

  static description = "Plays an explosion sound effect";
}

module.exports = ExplosionCommand;