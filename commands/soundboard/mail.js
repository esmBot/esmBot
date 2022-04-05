import SoundboardCommand from "../../classes/soundboardCommand.js";

class MailCommand extends SoundboardCommand {
  static file = "./assets/audio/mail.ogg";
  static description = "Plays the \"You've got mail\" sound effect";
  static aliases = ["yougotmail", "youvegotmail", "aol"];
}

export default MailCommand;