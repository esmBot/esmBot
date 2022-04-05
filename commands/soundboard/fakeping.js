import SoundboardCommand from "../../classes/soundboardCommand.js";

class FakePingCommand extends SoundboardCommand {
  static file = "./assets/audio/ping.ogg";
  static description = "Plays a Discord ping sound effect";
  static aliases = ["notification", "notif"];
}

export default FakePingCommand;