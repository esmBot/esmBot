import MediaCommand from "#cmd-classes/mediaCommand.js";
import { random } from "#utils/misc.js";
const names = ["esmBot", "me_irl", "dankmemes", "hmmm", "gaming", "wholesome", "chonkers", "memes", "funny", "lies"];

class RedditCommand extends MediaCommand {
  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter((item) => !item.includes(url ?? "")).join(" ");
    return {
      caption: newArgs?.trim() ? newArgs.replaceAll("\n", "").replaceAll(" ", "") : random(names),
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    return this;
  }

  static textOptional = true;

  static description = "Adds a Reddit watermark to an image";

  static noParam = "You need to provide some text to add a Reddit watermark!";
  static command = "reddit";
}

export default RedditCommand;
