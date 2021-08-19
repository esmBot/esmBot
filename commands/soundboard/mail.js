import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class MailCommand extends MusicCommand {
  async run() {
    return await play(this.client, "./assets/audio/mail.ogg", this.message);
  }

  static description = "Plays the \"You've got mail\" sound effect";
  static aliases = ["yougotmail", "youvegotmail", "aol"];
}

export default MailCommand;