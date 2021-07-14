const ImageCommand = require("../../classes/imageCommand.js");
const { random } = require("../../utils/misc.js");
const names = ["esmBot", "me_irl", "dankmemes", "hmmm", "gaming", "wholesome", "chonkers", "memes", "funny", "pcmasterrace", "bellybros"];

class RedditCommand extends ImageCommand {
  params() {
    return {
      caption: this.args.length === 0 ? random(names) : this.args.join(" ").replaceAll("\n", "").replaceAll(" ", "")
    };
  }

  static description = "Adds a Reddit watermark to an image";
  static arguments = ["{text}"];

  static noText = "You need to provide some text to add a Reddit watermark!";
  static command = "reddit";
}

module.exports = RedditCommand;