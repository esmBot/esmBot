import { Message } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class AddToSkuubCommand extends Command {
  async run() {
    if (!this.database) return "No database configured.";
    const message = this.interaction?.data.target;
    if (!(message instanceof Message)) throw Error("Target is not a message");

    const url = message.attachments.first()?.url ?? message.embeds[0]?.image?.url ?? message.embeds[0]?.thumbnail?.url;
    if (!url) return "No image found in that message.";

    await this.database.addSkuubImage(url);
    return `Added to skuub pool!`;
  }

  static ephemeral = true;
}

export default AddToSkuubCommand;
