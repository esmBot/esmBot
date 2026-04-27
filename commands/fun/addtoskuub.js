import Command from "#cmd-classes/command.js";
import { selectedImages } from "#utils/collections.js";

const ALLOWED = ["skuub", "skuubedait"];

class AddToSkuubCommand extends Command {
  async run() {
    if (!this.database) return "No database configured.";
    const selected = selectedImages.get(this.author.id);
    if (!selected) return "No image selected. Use /select-image on a message first.";
    const caption = (this.getOptionString("caption") ?? this.args.join(" ")).toLowerCase();
    if (!ALLOWED.some((word) => caption.includes(word))) return `Caption must contain "skuub" or "skuubedait".`;
    await this.database.addSkuubImage(selected.url);
    return "Added to skuub pool!";
  }

  static description = "Adds your selected image to the skuub pool";
  static aliases = ["addskuub"];
}

export default AddToSkuubCommand;
