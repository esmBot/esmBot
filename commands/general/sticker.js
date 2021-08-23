import Command from "../../classes/command.js";

class StickerCommand extends Command {
  async run() {
    if (!this.message.stickerItems) return "You need to provide a sticker!";
    const sticker = this.message.stickerItems[0];
    if (sticker.format_type === 1) { // PNG
      return `https://cdn.discordapp.com/stickers/${sticker.id}.png`;
    } else if (sticker.format_type === 2) { // APNG
      return {
        embed: {
          color: 16711680,
          description: `[This sticker is an APNG; however, since Discord doesn't allow displaying APNGs outside of stickers, you'll have to save it or open it in your browser to view it.](https://cdn.discordapp.com/stickers/${sticker.id}.png)`,
          image: {
            url: `https://cdn.discordapp.com/stickers/${sticker.id}.png`
          }
        }
      };
    } else if (sticker.format_type === 3) { // Lottie
      return `I can't display this sticker because it uses the Lottie animation format; however, I can give you the raw JSON link to it: https://cdn.discordapp.com/stickers/${sticker.id}.json`;
    } else {
      return "I don't recognize that sticker format!";
    }
  }

  static description = "Gets a raw sticker image";
  static aliases = ["s", "stick"];
  static arguments = ["[sticker]"];
}

export default StickerCommand;