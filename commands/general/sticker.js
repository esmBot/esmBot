import Command from "../../classes/command.js";
import imagedetect from "../../utils/imagedetect.js";

class StickerCommand extends Command {
  async run() {
    const result = await imagedetect(this.client, this.message, this.interaction, this.options, false, false, true);
    this.success = false;
    if (!result) return "You need to provide a sticker!";
    if (result.format_type === 1) { // PNG
      this.success = true;
      return `https://cdn.discordapp.com/stickers/${result.id}.png`;
    } else if (result.format_type === 2) { // APNG
      this.success = true;
      return {
        embeds: [{
          color: 16711680,
          description: `[This sticker is an APNG; however, since Discord doesn't allow displaying APNGs outside of stickers, you'll have to save it or open it in your browser to view it.](https://cdn.discordapp.com/stickers/${result.id}.png)`,
          image: {
            url: `https://cdn.discordapp.com/stickers/${result.id}.png`
          }
        }]
      };
    } else if (result.format_type === 3) { // Lottie
      this.success = true;
      return `I can't display this sticker because it uses the Lottie animation format; however, I can give you the raw JSON link to it: https://cdn.discordapp.com/stickers/${result.id}.json`;
    } else {
      return "I don't recognize that sticker format!";
    }
  }

  static description = "Gets a raw sticker image";
  static aliases = ["stick"];
  
  static userAllowed = false;
}

export default StickerCommand;