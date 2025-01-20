import paginator from "../../utils/pagination/pagination.js";
import serversConfig from "../../config/servers.json" with { type: "json" };
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class ImageSearchCommand extends Command {
  async run() {
    this.success = false;
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const query = this.options.query ?? this.args.join(" ");
    if (!query || !query.trim()) return this.getString("commands.responses.image.noInput");
    await this.acknowledge();
    const embeds = [];
    const rawImages = await fetch(`${random(serversConfig.searx)}/search?format=json&safesearch=2&engines=google%20images,bing%20images&q=${encodeURIComponent(query)}`).then(res => res.json());
    if (rawImages.results.length === 0) return this.getString("commands.responses.image.noResults");
    const images = rawImages.results.filter((val) => val.img_src.startsWith("https://") && val.url.startsWith("https://"));
    for (const [i, value] of images.entries()) {
      embeds.push({
        embeds: [{
          title: value.title,
          url: encodeURI(value.url),
          color: 16711680,
          footer: {
            text: `Page ${i + 1} of ${images.length}`
          },
          image: {
            url: encodeURI(value.img_src)
          },
          author: {
            name: this.getString("commands.responses.image.results"),
            iconURL: this.client.user.avatarURL()
          }
        }]
      });
    }
    this.success = true;
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static flags = [{
    name: "query",
    type: 3,
    description: "The query you want to search for",
    classic: true,
    required: true
  }];

  static description = "Searches for images across the web";
  static aliases = ["im", "photo", "img"];
}

export default ImageSearchCommand;
