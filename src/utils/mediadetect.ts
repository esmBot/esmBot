import process from "node:process";
import {
  type Client,
  type CommandInteraction,
  Constants,
  type Message,
  type MessageComponent,
  type MessageSnapshotMessage,
  type Permission,
  PrivateChannel,
  type StickerItem,
  TextableChannel,
  ThreadChannel,
} from "oceanic.js";
import logger from "./logger.ts";
import type { MediaMeta } from "./types.ts";

const tenorURLs = ["tenor.com", "www.tenor.com"];
const giphyURLs = ["giphy.com", "www.giphy.com", "i.giphy.com"];
const giphyMediaURLs = [
  // there could be more of these
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
];
const klipyURLs = ["klipy.com"];

const combined = [...tenorURLs, ...giphyURLs, ...giphyMediaURLs, ...klipyURLs];

const providerUrls = ["https://tenor.co", "https://tenor.com", "https://giphy.com", "https://klipy.com"];

const discordCDNDomains = ["cdn.discordapp.com", "media.discordapp.net"];
const discordProxyDomains = ["images-ext-1.discordapp.net", "images-ext-2.discordapp.net"];

type KlipyMediaObject = {
  url: string;
  width: number;
  height: number;
  size: number;
};

type KlipyMediaTypes = {
  gif: KlipyMediaObject;
  webp: KlipyMediaObject;
  jpg: KlipyMediaObject;
  mp4: KlipyMediaObject;
  webm: KlipyMediaObject;
};

type KlipyMediaResult = {
  id: number;
  slug: string;
  title: string;
  file: {
    hd: KlipyMediaTypes;
    md: KlipyMediaTypes;
    sm: KlipyMediaTypes;
    xs: KlipyMediaTypes;
  };
  tags: string[];
  type: string;
  blur_preview: string;
};

type KlipyResponse = {
  result: boolean;
  errors?: {
    message: string[];
  };
  data: {
    data: KlipyMediaResult[];
  };
};

const tenorRegex = /^https:\/\/media\d\.tenor\.com\/m\/(\w+)\/[\w-%]+\.gif$/;

/**
 * Gets proper media paths.
 */
async function getMedia(
  media: string,
  media2: string,
  spoiler = false,
  client?: Client,
): Promise<MediaMeta | undefined> {
  let mediaURL: URL;
  try {
    mediaURL = new URL(media);
  } catch {
    return;
  }
  if (!mediaURL.host) return;
  if (mediaURL.protocol !== "http:" && mediaURL.protocol !== "https:") return;
  const payload: MediaMeta = {
    path: media,
    spoiler,
  };
  const url2 = new URL(media2);
  const host = url2.host;
  if (combined.includes(host)) {
    if (tenorURLs.includes(host) && url2.pathname.startsWith("/view/")) {
      const tenorURL = url2;
      if (!tenorURL.pathname.endsWith(".gif")) tenorURL.pathname += ".gif";

      const redirectReq = await fetch(tenorURL, { method: "HEAD", redirect: "manual" });
      if (redirectReq.status !== 301 && redirectReq.status !== 302) return;

      const redirect = redirectReq.headers.get("location");
      if (!redirect) return;

      // format it into a "proper" raw link
      const match = tenorRegex.exec(redirect);
      if (!match) return;
      payload.path = `https://c.tenor.com/${match[1]}/tenor.gif`;
    } else if (klipyURLs.includes(host)) {
      if (!process.env.KLIPY || process.env.KLIPY === "") return;
      if (!media2.includes("klipy.com/gifs/")) return;

      const id = url2.pathname.replace("/gifs/", "");
      const data = await fetch(`https://api.klipy.com/api/v1/${process.env.KLIPY}/gifs/items?slugs=${id}`);
      if (data.status === 429) return;

      const json = (await data.json()) as KlipyResponse;
      if (json.errors) throw AggregateError(json.errors.message);
      if (json.data.data.length === 0) return;

      payload.path = json.data.data[0].file.hd.gif.url;
    } else if (giphyURLs.includes(host)) {
      // Can result in an HTML page instead of a WEBP
      payload.path = `https://media0.giphy.com/media/${media2.split("/")[4].split("-").pop()}/giphy.webp`;
    } else if (giphyMediaURLs.includes(host)) {
      payload.path = `https://media0.giphy.com/media/${media2.split("/")[4]}/giphy.webp`;
    }
  } else {
    if (
      discordCDNDomains.includes(mediaURL.host) &&
      mediaURL.pathname.match(/^\/(?:ephemeral-)?attachments\/\d+\/\d+\//)
    ) {
      let url: URL;
      if (client && isAttachmentExpired(mediaURL)) {
        const refreshed = await client.rest.misc.refreshAttachmentURLs([media]);
        url = new URL(refreshed.refreshedURLs[0].refreshed);
      } else {
        url = new URL(media);
      }
      url.searchParams.set("animated", "true");
    } else if (discordProxyDomains.includes(mediaURL.host) && mediaURL.pathname.match(/^\/external\/[\w-]+\//)) {
      mediaURL.searchParams.set("animated", "true");
    }
    payload.path = mediaURL.toString();
  }
  return payload;
}

/**
 * Checks a single message for media
 */
async function checkMedia(message: Message): Promise<MediaMeta[]> {
  const types: MediaMeta[] = [];

  // first check the embeds
  if (message.embeds.length !== 0) {
    const type = await checkEmbeds(message);
    if (type) types.push(...type);
  }

  // then check the components
  if (message.components.length !== 0) {
    const type = await checkComponents(message.components);
    if (type) types.push(...type);
  }

  // then check the attachments
  if (message.attachments.size !== 0) {
    const firstAttachment = message.attachments.first();
    if (firstAttachment) {
      const type = await getMedia(
        firstAttachment.proxyURL,
        firstAttachment.url,
        !!(firstAttachment.flags & Constants.AttachmentFlags.IS_SPOILER),
      );
      if (type) types.push(type);
    }
  }

  // then check embeds, components, and attachments inside forwards
  if (message.messageSnapshots?.[0]) {
    const forward = message.messageSnapshots?.[0].message;
    if (forward.embeds.length !== 0) {
      const type = await checkEmbeds(forward);
      if (type) types.push(...type);
    }
    if (forward.components.length !== 0) {
      const type = await checkComponents(forward.components);
      if (type) types.push(...type);
    }

    if (forward.attachments.length !== 0) {
      const type = await getMedia(
        forward.attachments[0].proxyURL,
        forward.attachments[0].url,
        !!(forward.attachments[0].flags & Constants.AttachmentFlags.IS_SPOILER),
      );
      if (type) types.push(type);
    }
  }

  // if the return value exists then return it
  return types;
}

async function checkComponents(components: MessageComponent[]) {
  const arr = [];

  for (const component of components) {
    // full-size image/video
    if (component.type === Constants.ComponentTypes.MEDIA_GALLERY) {
      const media = await getMedia(
        component.items[0].media.proxyURL ?? component.items[0].media.url,
        component.items[0].media.url,
        component.items[0].spoiler,
      );
      if (media) arr.push(media);
    }
    // section thumbnail
    if (
      component.type === Constants.ComponentTypes.SECTION &&
      component.accessory.type === Constants.ComponentTypes.THUMBNAIL
    ) {
      const media = await getMedia(
        component.accessory.media.proxyURL ?? component.accessory.media.url,
        component.accessory.media.url,
        component.accessory.spoiler,
      );
      if (media) arr.push(media);
    }
    // raw file
    if (component.type === Constants.ComponentTypes.FILE) {
      const media = await getMedia(
        component.file.proxyURL ?? component.file.url,
        component.file.url,
        component.spoiler,
      );
      if (media) arr.push(media);
    }
  }
  return arr;
}

async function checkEmbeds(message: Message | MessageSnapshotMessage) {
  let hasSpoiler = false;
  if (message.embeds[0].url && message.content) {
    const spoilerRegex = /\|\|.*https?:\/\/.*\|\|/s;
    hasSpoiler = spoilerRegex.test(message.content);
  }

  const arr = [];

  // embeds can vary in types, we check for gifvs first
  if (
    message.embeds[0].provider?.url &&
    providerUrls.includes(message.embeds[0].provider?.url) &&
    message.embeds[0].video?.url &&
    message.embeds[0].url &&
    (message.embeds[0].provider.url === "https://klipy.com" ? process.env.KLIPY && process.env.KLIPY !== "" : true)
  ) {
    const media = await getMedia(message.embeds[0].video.url, message.embeds[0].url, hasSpoiler);
    if (media) arr.push(media);
  } else if (message.embeds[0].thumbnail) {
    // then thumbnails
    const media = await getMedia(
      message.embeds[0].thumbnail.proxyURL ?? message.embeds[0].thumbnail.url,
      message.embeds[0].thumbnail.url,
      hasSpoiler,
    );
    if (media) arr.push(media);
  } else if (message.embeds[0].image) {
    // and finally direct images
    const media = await getMedia(
      message.embeds[0].image.proxyURL ?? message.embeds[0].image.url,
      message.embeds[0].image.url,
      hasSpoiler,
    );
    if (media) arr.push(media);
  }

  return arr;
}

/**
 * Checks whether an attachment URL has already expired
 */
function isAttachmentExpired(url: URL): boolean {
  try {
    const expiry = url.searchParams.get("ex");
    return !expiry || expiry.length > 8 || Date.now() >= Number(`0x${expiry}`) * 1000;
  } catch {
    // ignore invalid expiration dates
  }
  return true;
}

export async function stickerDetect(
  client: Client,
  perms: Permission,
  cmdMessage?: Message,
  interaction?: CommandInteraction,
): Promise<StickerItem | undefined> {
  if (cmdMessage) {
    // check if the message is a reply to another message
    if (cmdMessage.messageReference?.channelID && cmdMessage.messageReference.messageID) {
      const replyMessage = await client.rest.channels
        .getMessage(cmdMessage.messageReference.channelID, cmdMessage.messageReference.messageID)
        .catch(() => undefined);
      if (replyMessage?.stickerItems) return replyMessage.stickerItems[0];
    }
    // then we check the current message
    if (cmdMessage?.stickerItems) return cmdMessage.stickerItems[0];
  }
  if (cmdMessage || interaction?.authorizingIntegrationOwners?.[0] !== undefined) {
    // if there aren't any replies then iterate over the last few messages in the channel
    const context = interaction ?? cmdMessage;
    if (context == null) throw Error("Unknown context");
    const channel =
      context.channel ??
      (await client.rest.channels.get(context.channelID).catch((e) => {
        logger.warn(`Failed to get a text channel: ${e}`);
      }));
    if (
      !(channel instanceof TextableChannel) &&
      !(channel instanceof ThreadChannel) &&
      !(channel instanceof PrivateChannel)
    )
      return;
    if (interaction?.authorizingIntegrationOwners?.[0] !== "0" && perms && !perms.has("READ_MESSAGE_HISTORY")) return;
    const messages = await channel.getMessages();
    // iterate over each message
    for (const message of messages) {
      if (message?.stickerItems) return message.stickerItems[0];
    }
  }
}

/**
 * Checks for the latest message containing media and returns the URL of said media.
 */
export default async (
  client: Client,
  perms: Permission,
  cmdMessage?: Message,
  interaction?: CommandInteraction,
  singleMessage = false,
): Promise<MediaMeta[]> => {
  const arr: MediaMeta[] = [];
  // we start by determining whether or not we're dealing with an interaction or a message
  if (interaction) {
    // we can get a raw attachment or a URL in the interaction itself
    const attachment = interaction.data.options.getAttachment("image");
    if (attachment) {
      const media = await getMedia(
        attachment.proxyURL,
        attachment.url,
        !!(attachment.flags & Constants.AttachmentFlags.IS_SPOILER),
      );
      if (media) arr.push(media);
    }
    const link = interaction.data.options.getString("link");
    if (link) {
      const media = await getMedia(link, link, false, interaction.client);
      if (media) arr.push(media);
    }
  }
  if (arr.length > 0) return arr;
  if (cmdMessage) {
    // check if the message is a reply to another message
    if (cmdMessage.messageReference?.channelID && cmdMessage.messageReference.messageID && !singleMessage) {
      const replyMessage = await client.rest.channels
        .getMessage(cmdMessage.messageReference.channelID, cmdMessage.messageReference.messageID)
        .catch(() => undefined);
      if (replyMessage) {
        const replyResult = await checkMedia(replyMessage);
        if (replyResult) arr.push(...replyResult);
      }
    }
    // then we check the current message
    const result = await checkMedia(cmdMessage);
    if (result) arr.push(...result);
  }
  if (arr.length > 0) return arr;
  if (!singleMessage && (cmdMessage || interaction?.authorizingIntegrationOwners?.[0] !== undefined)) {
    // if there aren't any replies or interaction attachments then iterate over the last few messages in the channel
    const context = interaction ?? cmdMessage;
    if (context == null) throw Error("Unknown context");
    const channel =
      context.channel ??
      (await client.rest.channels.get(context.channelID).catch((e) => {
        logger.warn(`Failed to get a text channel: ${e}`);
      }));
    if (
      !(channel instanceof TextableChannel) &&
      !(channel instanceof ThreadChannel) &&
      !(channel instanceof PrivateChannel)
    )
      return arr;
    if (interaction?.authorizingIntegrationOwners?.[0] !== "0" && perms && !perms.has("READ_MESSAGE_HISTORY"))
      return arr;
    const messages = await channel.getMessages({ limit: 50 });
    // iterate over each message
    for (const message of messages) {
      const result = await checkMedia(message);
      if (result.length > 0) {
        arr.push(...result);
      }
    }
  }
  return arr;
};
