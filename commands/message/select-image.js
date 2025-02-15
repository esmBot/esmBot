import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";
import { selectedImages } from "../../utils/collections.js";
import { Message } from "oceanic.js";

class SelectImageCommand extends Command {
  async run() {
    const message = this.interaction?.data.target;
    if (!(message instanceof Message)) throw Error("Target is not a message");
    const image = await imageDetect(this.client, message, this.interaction, {
      image: this.getOptionString("image"),
      link: this.getOptionString("link")
    }, true, false, false, true).catch(e => {
      if (e.name === "AbortError") return { type: "timeout" };
      throw e;
    });
    this.success = false;
    if (image === undefined) {
      return this.getString("image.couldNotFind");
    }
    if (image.type === "large") {
      return this.getString("image.large");
    }
    if (image.type === "tenorlimit") {
      return this.getString("image.tenor");
    }
    if (image.type === "timeout") {
      return this.getString("image.timeout");
    }
    if (image.type === "badurl") {
      return this.getString("image.badurl");
    }
    selectedImages.set(this.author.id, image);
    return this.getString("image.selected");
  }

  static ephemeral = true;
}

export default SelectImageCommand;