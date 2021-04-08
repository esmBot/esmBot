const fs = require("fs");
const emojiRegex = require("emoji-regex");
const emoji = require("node-emoji");
const ImageCommand = require("../../classes/imageCommand.js");

class FlagCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
    this.flagPath = "";
  }

  criteria(args) {
    if (!args[0].match(emojiRegex)) return false;
    const flag = emoji.unemojify(args[0]).replaceAll(":", "").replace("flag-", "");
    let path = `./assets/images/region-flags/png/${flag.toUpperCase()}.png`;
    if (flag === "🏴‍☠️") path = "./assets/images/pirateflag.png";
    if (flag === "rainbow-flag") path = "./assets/images/rainbowflag.png";
    if (flag === "checkered_flag") path = "./assets/images/checkeredflag.png";
    if (flag === "🏳️‍⚧️") path = "./assets/images/transflag.png";
    try {
      fs.promises.access(path);
      this.flagPath = path;
      return true;
    } catch (e) {
      return false;
    }
  }

  params() {
    return {
      overlay: this.flagPath
    };
  }

  static description = "Overlays a flag onto an image";
  static arguments = ["[flag]"];

  static requiresText = true;
  static noText = "you need to provide an emoji of a flag to overlay!";
  static noImage = "you need to provide an image to overlay a flag onto!";
  static command = "flag";
}

module.exports = FlagCommand;