import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class EmoteCommand extends Command {
  async run() {
    let emoji = this.getOptionString("emoji") ?? this.content;
    if (
      this.type === "classic" &&
      this.message?.messageReference?.channelID &&
      this.message.messageReference.messageID
    ) {
      const replyMessage = await this.client.rest.channels
        .getMessage(this.message.messageReference.channelID, this.message.messageReference.messageID)
        .catch(() => undefined);
      if (replyMessage) emoji = `${emoji} ${replyMessage.content}`;
    }
    if (!emoji) return this.getString("commands.responses.emote.noInput");
    const matches = emoji.matchAll(/<(a?):[\w\d_]+:(\d+)>/g);
    const urls = [];
    for (const match of matches) {
      urls.push(`https://cdn.discordapp.com/emojis/${match[2]}.${match[1] === "a" ? "gif" : "png"}`);
    }
    const emojiMatches = emoji.match(/\p{RGI_Emoji}/gv);
    if (emojiMatches) {
      for (const emoji of emojiMatches) {
        const codePoints = [...emoji].map((v) => v.codePointAt(0)?.toString(16)).join("-");
        urls.push(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/${codePoints}.png`);
      }
    }
    if (urls.length > 0) return urls.join(" ");
    this.success = false;
    return this.getString("commands.responses.emote.invalidEmoji");
  }

  static flags = [
    {
      name: "emoji",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The emoji you want to get",
      classic: true,
      required: true,
    },
  ];

  static description = "Gets a raw emote image";
  static aliases = ["e", "em", "hugemoji", "hugeemoji", "emoji"];
}

export default EmoteCommand;
