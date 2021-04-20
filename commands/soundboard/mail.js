const SoundCommand = require("../../classes/soundCommand");

class MailCommand extends SoundCommand {
  sound = "mail.ogg";
  static description = "Plays the \"You've got mail\" sound effect";
  static aliases = ["yougotmail", "youvegotmail", "aol"];
}

module.exports = MailCommand;