const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class FakePingCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play("./assets/audio/ping.ogg", this.message);
  }

  static description = "Plays a Discord ping sound effect";
  static aliases = ["notification", "notif"];
}

module.exports = FakePingCommand;