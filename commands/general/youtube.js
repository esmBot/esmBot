import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import serversConfig from "#config/servers.json" with { type: "json" };
import paginator from "#pagination";
import { random } from "#utils/misc.js";

class YouTubeCommand extends Command {
  async run() {
    const query = this.getOptionString("query") ?? this.args.join(" ");
    this.success = false;
    if (!query || !query.trim()) return this.getString("commands.responses.youtube.noInput");
    await this.acknowledge();
    const messages = [];
    /**
     * @type {import("#utils/types.ts").SearXNGResults}
     */
    const videos = await fetch(
      `${random(serversConfig.searx)}/search?format=json&safesearch=1&categories=videos&q=!youtube%20${encodeURIComponent(query)}`,
    ).then((res) => res.json());
    if (videos.results.length === 0) return this.getString("commands.responses.youtube.noResults");
    for (const [i, value] of videos.results.entries()) {
      messages.push({
        content: `${this.getString("pagination.page", {
          params: {
            page: (i + 1).toString(),
            amount: videos.results.length.toString(),
          },
        })}\n▶️ **${value.title.replaceAll("*", "\\*")}**\nUploaded by **${value.author?.replaceAll("*", "\\*") ?? "N/A"}**\n${value.url}`,
      });
    }
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      messages,
    );
  }

  static flags = [
    {
      name: "query",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The query you want to search for",
      classic: true,
      required: true,
    },
  ];

  static description = "Searches YouTube";
  static aliases = ["yt", "video", "ytsearch"];
}

export default YouTubeCommand;
