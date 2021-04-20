const soundPlayer = require("../../utils/soundplayer");
const MusicCommand = require("../../classes/musicCommand");

class FakePingCommand extends MusicCommand {
  async run() {
    return await soundPlayer.play(this.client, "./assets/audio/ping.ogg", this.message);
  }

  static description = "Plays a Discord ping sound effect";
  static aliases = ["notification", "notif"];
}

module.exports = FakePingCommand;