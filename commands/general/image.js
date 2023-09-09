import paginator from "../../utils/pagination/pagination.js";
import { readFileSync } from "fs";
const { searx } = JSON.parse(readFileSync(new URL("../../config/servers.json", import.meta.url)));
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class ImageSearchCommand extends Command {
  async run() {
    this.success = false;
    if (!this.permissions.has("EMBED_LINKS")) return "I don't have the `Embed Links` permission!";
    const query = this.options.query ?? this.args.join(" ");
    if (!query || !query.trim()) return "You need to provide something to search for!";
    await this.acknowledge();
    const embeds = [];
    const rawImages = await fetch(`${random(searx)}/search?format=json&safesearch=2&engines=google%20images,bing%20images&q=${encodeURIComponent(query)}`).then(res => res.json());
    if (rawImages.results.length === 0) return "I couldn't find any results!";
    const images = rawImages.results.filter((val) => !val.img_src.startsWith("data:"));
    for (const [i, value] of images.entries()) {
      embeds.push({
        embeds: [{
          title: value.title,
          url: value.url,
          color: 16711680,
          footer: {
            text: `Page ${i + 1} of ${images.length}`
          },
          image: {
            url: encodeURI(value.img_src)
          },
          author: {
            name: "Search Results",
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
    required: true
  }];

  static description = "Searches for images across the web";
  static aliases = ["im", "photo", "img"];
  static arguments = ["[query]"];
}

export default ImageSearchCommand;
