import Command from "#cmd-classes/command.js";
import { stickerDetect } from "#utils/imagedetect.js";

class StickerCommand extends Command {
  async run() {
    if (!this.permissions.has("EMBED_LINKS")) {
      this.success = false;
      return this.getString("permissions.noEmbedLinks");
    }
    const result = await stickerDetect(this.client, this.permissions, this.message, this.interaction);
    this.success = false;
    if (!result) return this.getString("commands.responses.sticker.noInput");
    if (result.format_type === 1) {
      // PNG
      this.success = true;
      return `https://cdn.discordapp.com/stickers/${result.id}.png`;
    }
    if (result.format_type === 2) {
      // APNG
      this.success = true;
      return {
        embeds: [
          {
            color: 0xff0000,
            description: `[${this.getString("commands.responses.sticker.apng")}](https://cdn.discordapp.com/stickers/${result.id}.png)`,
            image: {
              url: `https://cdn.discordapp.com/stickers/${result.id}.png`,
            },
          },
        ],
      };
    }
    if (result.format_type === 3) {
      // Lottie
      this.success = true;
      return `${this.getString("commands.responses.sticker.lottie")} https://cdn.discordapp.com/stickers/${result.id}.json`;
    }
    if (result.format_type === 4) {
      // GIF
      this.success = true;
      return `https://media.discordapp.net/stickers/${result.id}.gif`;
    }
    return this.getString("commands.responses.sticker.unknown");
  }

  static description = "Gets a raw sticker image";
  static aliases = ["stick"];

  static userAllowed = false;
}

export default StickerCommand;
