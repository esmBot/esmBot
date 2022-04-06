import Command from "./command.js";
import { play } from "../utils/soundplayer.js";

// only exists to sort the various soundboard commands
class SoundboardCommand extends Command {
  async run() {
    return await play(this.client, this.constructor.file, { channel: this.channel, author: this.author, member: this.member, type: this.type, interaction: this.interaction });
  }

  static requires = ["sound"];
  static slashAllowed = false;
}

export default SoundboardCommand;
