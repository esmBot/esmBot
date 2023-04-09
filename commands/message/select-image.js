import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";
import { selectedImages } from "../../utils/collections.js";

class SelectImageCommand extends Command {
  async run() {
    await this.acknowledge(64);
    const message = this.interaction.data.target;
    const image = await imageDetect(this.client, message, this.interaction, this.options, true, false, false, true);
    this.success = false;
    if (image === undefined) {
      return "I couldn't find an image in that message!";
    } else if (image.type === "large") {
      return "That image is too large (>= 25MB)! Try using a smaller image.";
    } else if (image.type === "tenorlimit") {
      return "I've been rate-limited by Tenor. Please try uploading your GIF elsewhere.";
    }
    selectedImages.set(this.author.id, image);
    return "The image has been selected for your next command.";
  }
}

export default SelectImageCommand;