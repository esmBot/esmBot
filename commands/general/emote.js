import emojiRegex from "emoji-regex";
import Command from "../../classes/command.js";

class EmoteCommand extends Command {
  async run() {
    const emoji = this.options.emoji ?? this.content;
    if (emoji?.trim() && emoji.split(" ")[0].match(/^<a?:.+:\d+>$/)) {
      return `https://cdn.discordapp.com/emojis/${emoji.split(" ")[0].replace(/^<(a)?:.+:(\d+)>$/, "$2")}.${emoji.split(" ")[0].replace(/^<(a)?:.+:(\d+)>$/, "$1") === "a" ? "gif" : "png"}`;
    } else if (emoji.match(emojiRegex())) {
      const codePoints = [];
      for (const codePoint of emoji) {
        codePoints.push(codePoint.codePointAt(0).toString(16));
      }
      return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/${codePoints.join("-")}.png`;
    } else {
      this.success = false;
      return "You need to provide a valid emoji to get an image!";
    }
  }

  static flags = [{
    name: "emoji",
    type: 3,
    description: "The emoji you want to get",
    required: true
  }];

  static description = "Gets a raw emote image";
  static aliases = ["e", "em", "hugemoji", "hugeemoji", "emoji"];
  static arguments = ["[emote]"];
}

export default EmoteCommand;
