const SoundCommand = require("../../classes/soundCommand");

class FakePingCommand extends SoundCommand {
  sound = "ping.ogg";

  static description = "Plays a Discord ping sound effect";
  static aliases = ["notification", "notif"];
}

module.exports = FakePingCommand;