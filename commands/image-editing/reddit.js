import ImageCommand from "../../classes/imageCommand.js";
import { random } from "../../utils/misc.js";
const names = ["esmBot", "me_irl", "dankmemes", "hmmm", "gaming", "wholesome", "chonkers", "memes", "funny", "lies"];

class RedditCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: newArgs?.trim() ? newArgs.replaceAll("\n", "").replaceAll(" ", "") : random(names)
    };
  }

  static textOptional = true;

  static description = "Adds a Reddit watermark to an image";

  static noText = "You need to provide some text to add a Reddit watermark!";
  static command = "reddit";
}

export default RedditCommand;
