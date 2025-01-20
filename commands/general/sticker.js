import Command from "../../classes/command.js";
import imagedetect from "../../utils/imagedetect.js";

class StickerCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const result = await imagedetect(this.client, this.message, this.interaction, this.options, false, false, true);
    this.success = false;
    if (!result) return this.getString("commands.responses.sticker.noInput");
    if (result.format_type === 1) { // PNG
      this.success = true;
      return `https://cdn.discordapp.com/stickers/${result.id}.png`;
    }
    if (result.format_type === 2) { // APNG
      this.success = true;
      return {
        embeds: [{
          color: 16711680,
          description: `[${this.getString("commands.responses.sticker.apng")}](https://cdn.discordapp.com/stickers/${result.id}.png)`,
          image: {
            url: `https://cdn.discordapp.com/stickers/${result.id}.png`
          }
        }]
      };
    }
    if (result.format_type === 3) { // Lottie
      this.success = true;
      return `${this.getString("commands.responses.sticker.lottie")} https://cdn.discordapp.com/stickers/${result.id}.json`;
    }
    return this.getString("commands.responses.sticker.unknown");
  }

  static description = "Gets a raw sticker image";
  static aliases = ["stick"];
  
  static userAllowed = false;
}

export default StickerCommand;