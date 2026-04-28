import Command from "#cmd-classes/command.js";
import { generateSkuubCaptionIdea } from "#utils/captionIdeas.js";

class CaptionIdeaCommand extends Command {
  async run() {
    return await generateSkuubCaptionIdea();
  }

  static description = "Generates a skuub-style caption idea";
  static aliases = ["captionideas", "skuubcaption"];
}

export default CaptionIdeaCommand;
