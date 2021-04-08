const soundPlayer = require("../../utils/soundplayer.js");
const MusicCommand = require("../../classes/musicCommand.js");

class MailCommand extends MusicCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return await soundPlayer.play("./assets/audio/mail.ogg", this.message);
  }

  static description = "Plays the \"You've got mail\" sound effect";
  static aliases = ["yougotmail", "youvegotmail", "aol"];
}

module.exports = MailCommand;