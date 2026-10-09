import Command from "#cmd-classes/command.js";
import serversConfig from "#config/servers.json" with { type: "json" };
import paginator from "#pagination";
import logger from "#utils/logger.js";
import { random } from "#utils/misc.js";

class YouTubeCommand extends Command {
  async run() {
    const query = this.getOptionString("query") ?? this.args.join(" ");
    this.success = false;
    if (!query || !query.trim()) return this.getString("commands.responses.youtube.noInput");
    await this.acknowledge();
    const messages = [];
    let server = random(serversConfig.search);
    if (!server) {
      if (!serversConfig.searx && serversConfig.searx.length === 0)
        return this.getString("commands.responses.youtube.noEngines");
      logger.warn('!!! THE "searx" FIELD IN config/servers.json IS DEPRECATED !!!');
      logger.warn(
        'The "searx" field has been renamed to "search" and has a different format. Please update your config; esmBot will no longer read this field in a future version.',
      );
      server = {
        type: "searxng",
        url: random(serversConfig.searx),
      };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 6000);
    /**
     * @type {import("#utils/types.ts").SearXNGResults}
     */
    const videos = await fetch(
      new URL(
        server.type === "degoog"
          ? `/api/command?format=json&type=videos&q=${server.ytBang ?? "!youtube_noapi"}%20${encodeURIComponent(query)}`
          : `/search?format=json&safesearch=2&categories=videos&q=!youtube%20${encodeURIComponent(query)}`,
        server.url,
      ),
      {
        signal: controller.signal,
      },
    ).then((res) => res.json());
    clearTimeout(timeout);
    if (videos.results.length === 0) return this.getString("commands.responses.youtube.noResults");
    for (const [i, value] of videos.results.entries()) {
      messages.push({
        content: `${this.getString("pagination.page", {
          params: {
            page: (i + 1).toString(),
            amount: videos.results.length.toString(),
          },
        })}\n▶️ **${value.title.replaceAll("*", "\\*")}**${server.type === "degoog" ? "" : `\nUploaded by **${value.author?.replaceAll("*", "\\*") ?? "N/A"}**`}\n${value.url}`,
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
      type: "string",
      description: "The query you want to search for",
      classic: true,
      required: true,
    },
  ];

  static description = "Searches YouTube";
  static aliases = ["yt", "video", "ytsearch"];
}

export default YouTubeCommand;
