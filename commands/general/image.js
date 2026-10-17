import Command from "#cmd-classes/command.js";
import paginator from "#pagination";
import logger from "#utils/logger.js";
import { random } from "#utils/misc.js";
import serversConfig from "#utils/servers.js";
/** @import { CommandFlag, SearXNGResults } from "#utils/types.js" */

class ImageSearchCommand extends Command {
  async run() {
    this.success = false;
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const query = this.getOptionString("query") ?? this.args.join(" ");
    if (!query || !query.trim()) return this.getString("commands.responses.image.noInput");
    await this.acknowledge();
    const embeds = [];
    let server = random(serversConfig.search ?? []);
    if (!server) {
      if (!serversConfig.searx?.length) return this.getString("commands.responses.image.noEngines");
      logger.warn('!!! THE "searx" FIELD IN config/servers.json IS DEPRECATED !!!');
      logger.warn(
        'The "searx" field has been renamed to "search" and has a different format. Please update your config; esmBot will no longer read this field in a future version.',
      );
      server = {
        type: "searxng",
        url: random(serversConfig.searx),
        engines: ["duckduckgo images", "privacywall images", "google cse images"],
      };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 6000);
    const rawImages = await fetch(
      new URL(
        server.type === "degoog"
          ? `/api/search?format=json&safeMode=on&type=images&q=${encodeURIComponent(query)}`
          : `/search?format=json&safesearch=2&engines=${server.engines.map((e) => encodeURIComponent(e)).join(",")}&q=${encodeURIComponent(query)}`,
        server.url,
      ),
      {
        signal: controller.signal,
      },
    ).then((res) => /** @type {Promise<SearXNGResults>} */ (res.json()));
    clearTimeout(timeout);
    if (rawImages.results.length === 0) return this.getString("commands.responses.image.noResults");
    const images = rawImages.results
      .map((val) => {
        if (!val.img_src) return;
        if (!val.url.startsWith("https://")) return;
        const canonURL =
          server.type === "degoog" ? new URL(val.img_src, server.url).searchParams.get("url") : val.img_src;
        if (!canonURL?.startsWith("https://")) return;
        return {
          img_src: canonURL,
          title: val.title,
          url: val.url,
        };
      })
      .filter((val) => val !== undefined);
    for (const [i, value] of images.entries()) {
      embeds.push({
        embeds: [
          {
            title: value.title,
            url: value.url,
            color: 0xff0000,
            footer: {
              text: this.getString("pagination.page", {
                params: {
                  page: (i + 1).toString(),
                  amount: images.length.toString(),
                },
              }),
            },
            image: {
              url: value.img_src,
            },
            author: {
              name: this.getString("commands.responses.image.results"),
              iconURL: this.client.user.avatarURL(),
            },
          },
        ],
      });
    }
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  /** @type {CommandFlag[]} */
  static flags = [
    {
      name: "query",
      type: "string",
      description: "The query you want to search for",
      classic: true,
      required: true,
    },
  ];

  static description = "Searches for images across the web";
  static aliases = ["im", "photo", "img"];
}

export default ImageSearchCommand;
