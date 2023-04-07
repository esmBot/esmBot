import Command from "./command.js";
import { play } from "../utils/soundplayer.js";

// only exists to sort the various soundboard commands
class SoundboardCommand extends Command {
  async run() {
    return play(this.client, this.constructor.file, { channel: this.channel, guild: this.guild, author: this.author, member: this.member, type: this.type, interaction: this.interaction });
  }

  static slashAllowed = false;
  static directAllowed = false;
}

export default SoundboardCommand;
