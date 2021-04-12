const paginator = require("../../utils/pagination/pagination.js");
const { image_search } = require("duckduckgo-images-api");
const Command = require("../../classes/command.js");

class ImageSearchCommand extends Command {
  async run() {
    if (this.message.channel.guild && !this.message.channel.permissionsOf(this.client.user.id).has("addReactions")) return `${this.message.author.mention}, I don't have the \`Add Reactions\` permission!`;
    if (this.message.channel.guild && !this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return `${this.message.author.mention}, I don't have the \`Embed Links\` permission!`;
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide something to search for!`;
    const embeds = [];
    const images = await image_search({ query: this.args.join(" "), moderate: true });
    if (images.error && images.error.code === 403) return `${this.message.author.mention}, the daily search quota has been exceeded. Check back later.`;
    if (images.length === 0) return `${this.message.author.mention}, I couldn't find any results!`;
    for (const [i, value] of images.entries()) {
      embeds.push({
        "embed": {
          "title": "Search Results",
          "color": 16711680,
          "footer": {
            "text": `Page ${i + 1} of ${images.length}`
          },
          "image": {
            "url": value.image
          },
          "author": {
            "name": this.message.author.username,
            "icon_url": this.message.author.avatarURL
          }
        }
      });
    }
    return paginator(this.client, this.message, embeds);
  }

  static description = "Searches for images on DuckDuckGo";
  static aliases = ["im", "photo", "img"];
  static arguments = ["[query]"];
}

module.exports = ImageSearchCommand;