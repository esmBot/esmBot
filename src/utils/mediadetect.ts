import process from "node:process";
import {
  AttachmentFlags,
  type Client,
  type CommandInteraction,
  type Message,
  type MessageSnapshotMessage,
  type Permission,
  PrivateChannel,
  type StickerItem,
  TextableChannel,
  ThreadChannel,
} from "oceanic.js";
import { getType } from "./image.ts";
import logger from "./logger.ts";
import type { MediaTypeData } from "./types.ts";

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

const combined = [...tenorURLs, ...giphyURLs, ...giphyMediaURLs];

const providerUrls = ["https://tenor.co", "https://giphy.com"];

const imageFormats = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "large"];
const videoFormats = ["video/mp4", "video/webm", "video/mov"];

type TenorMediaObject = {
  url: string;
  dims: number[];
  duration: number;
  size: number;
};

type TenorResponse = {
  error?: {
    code: number;
    message: string;
    status: string;
  };
  results: {
    media_formats: { [key: string]: TenorMediaObject };
  }[];
};

export type ImageMeta = {
  path: string;
  type?: string;
  url: string;
  name: string;
  spoiler: boolean;
};

/**
 * Gets proper image paths.
 */
async function getImage(
  image: string,
  image2: string,
  video: boolean,
  spoiler = false,
  extraReturnTypes = false,
  type: string | null = null,
  client: Client | undefined = undefined,
): Promise<ImageMeta | undefined> {
  let imageURL: URL;
  try {
    imageURL = new URL(image);
    if (!imageURL.host) throw null;
    if (imageURL.protocol !== "http:" && imageURL.protocol !== "https:") throw null;
  } catch {
    return {
      url: image2,
      path: image,
      name: "null",
      type: "badurl",
      spoiler,
    };
  }
  const fileNameSplit = imageURL.pathname.split("/");
  const fileName = fileNameSplit[fileNameSplit.length - 1];
  const fileNameNoExtension = fileName.slice(0, fileName.lastIndexOf("."));
  const payload: ImageMeta = {
    url: image2,
    path: image,
    name: fileNameNoExtension,
    spoiler,
  };
  const host = new URL(image2).host;
  if (combined.includes(host)) {
    if (tenorURLs.includes(host)) {
      // Tenor doesn't let us access a raw GIF without going through their API,
      // so we use that if there's a key in the config
      if (process.env.TENOR !== "") {
        let id: string | undefined;
        if (image2.includes("tenor.com/view/")) {
          id = image2.split("-").pop();
        } else if (image2.endsWith(".gif")) {
          const redirect = (await fetch(image2, { method: "HEAD", redirect: "manual" })).headers.get("location");
          id = redirect?.split("-").pop();
        } else {
          return;
        }
        if (Number.isNaN(Number(id))) return;
        const data = await fetch(
          `https://tenor.googleapis.com/v2/posts?media_filter=gif&limit=1&client_key=esmBot%20${process.env.ESMBOT_VER}&key=${process.env.TENOR}&ids=${id}`,
        );
        if (data.status === 429) {
          if (extraReturnTypes) {
            payload.type = "tenorlimit";
            return payload;
          }
        }
        const json = (await data.json()) as TenorResponse;
        if (json.error) throw Error(json.error.message);
        if (json.results.length === 0) return;
        payload.path = json.results[0].media_formats.gif.url;
      } else {
        return;
      }
      payload.type = "image/gif";
    } else if (giphyURLs.includes(host)) {
      // Can result in an HTML page instead of a WEBP
      payload.path = `https://media0.giphy.com/media/${image2.split("/")[4].split("-").pop()}/giphy.webp`;
      payload.type = "image/webp";
    } else if (giphyMediaURLs.includes(host)) {
      payload.path = `https://media0.giphy.com/media/${image2.split("/")[4]}/giphy.webp`;
      payload.type = "image/webp";
    }
  } else {
    let result: MediaTypeData | undefined;
    if (
      (imageURL.host === "cdn.discordapp.com" || imageURL.host === "media.discordapp.net") &&
      imageURL.pathname.match(/^\/(?:ephemeral-)?attachments\/\d+\/\d+\//)
    ) {
      let url: URL;
      if (client && isAttachmentExpired(imageURL)) {
        const refreshed = await client.rest.misc.refreshAttachmentURLs([image]);
        url = new URL(refreshed.refreshedURLs[0].refreshed);
      } else {
        url = new URL(image);
      }
      url.searchParams.set("animated", "true");
      result = await getType(url, extraReturnTypes);
    } else if (
      (imageURL.host === "images-ext-1.discordapp.net" || imageURL.host === "images-ext-2.discordapp.net") &&
      imageURL.pathname.match(/^\/external\/[\w-]+\//)
    ) {
      imageURL.searchParams.set("animated", "true");
      result = await getType(imageURL, extraReturnTypes);
    } else {
      result = await getType(imageURL, extraReturnTypes);
    }
    if (!result) return;
    if (result.url) payload.path = result.url;
    payload.type = type ?? result.type;
    if (
      !payload.type ||
      ((video ? !videoFormats.includes(payload.type) : true) && !imageFormats.includes(payload.type))
    )
      return;
  }
  return payload;
}

/**
 * Checks a single message for videos or images
 */
async function checkImages(
  message: Message,
  extraReturnTypes: boolean,
  video: boolean,
): Promise<ImageMeta | undefined> {
  let type: ImageMeta | undefined;

  // first check the embeds
  if (message.embeds.length !== 0) {
    type = await checkEmbeds(message, extraReturnTypes, video);
  }

  // then check the attachments
  if (!type && message.attachments.size !== 0) {
    const firstAttachment = message.attachments.first();
    if (firstAttachment?.width)
      type = await getImage(
        firstAttachment.proxyURL,
        firstAttachment.url,
        video,
        !!(firstAttachment.flags & AttachmentFlags.IS_SPOILER),
      );
  }

  // then check embeds and attachments inside forwards
  if (!type && message.messageSnapshots?.[0]) {
    const forward = message.messageSnapshots?.[0].message;
    if (forward.embeds.length !== 0) type = await checkEmbeds(forward, extraReturnTypes, video);

    if (!type && forward.attachments.length !== 0) {
      if (forward.attachments[0].width)
        type = await getImage(
          forward.attachments[0].proxyURL,
          forward.attachments[0].url,
          video,
          !!(forward.attachments[0].flags & AttachmentFlags.IS_SPOILER),
        );
    }
  }

  // if the return value exists then return it
  return type;
}

function checkEmbeds(message: Message | MessageSnapshotMessage, extraReturnTypes: boolean, video: boolean) {
  let hasSpoiler = false;
  if (message.embeds[0].url && message.content) {
    const spoilerRegex = /\|\|.*https?:\/\/.*\|\|/s;
    hasSpoiler = spoilerRegex.test(message.content);
  }
  // embeds can vary in types, we check for gifvs first
  if (
    message.embeds[0].provider?.url &&
    providerUrls.includes(message.embeds[0].provider?.url) &&
    message.embeds[0].video?.url &&
    message.embeds[0].url
  ) {
    return getImage(message.embeds[0].video.url, message.embeds[0].url, video, hasSpoiler, extraReturnTypes);
    // then thumbnails
  } else if (message.embeds[0].thumbnail) {
    return getImage(
      message.embeds[0].thumbnail.proxyURL ?? message.embeds[0].thumbnail.url,
      message.embeds[0].thumbnail.url,
      video,
      hasSpoiler,
      extraReturnTypes,
    );
    // and finally direct images
  } else if (message.embeds[0].image) {
    return getImage(
      message.embeds[0].image.proxyURL ?? message.embeds[0].image.url,
      message.embeds[0].image.url,
      video,
      hasSpoiler,
      extraReturnTypes,
    );
  }
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
 * Checks for the latest message containing an image and returns the URL of the image.
 */
export default async (
  client: Client,
  perms: Permission,
  cmdMessage?: Message,
  interaction?: CommandInteraction,
  extraReturnTypes = false,
  video = false,
  singleMessage = false,
): Promise<ImageMeta | undefined> => {
  // we start by determining whether or not we're dealing with an interaction or a message
  if (interaction) {
    // we can get a raw attachment or a URL in the interaction itself
    const attachment = interaction.data.options.getAttachment("image");
    if (attachment) {
      return getImage(
        attachment.proxyURL,
        attachment.url,
        video,
        !!(attachment.flags & AttachmentFlags.IS_SPOILER),
        !!attachment.contentType,
      );
    }
    const link = interaction.data.options.getString("link");
    if (link) {
      return getImage(link, link, video, false, extraReturnTypes, null, interaction.client);
    }
  }
  if (cmdMessage) {
    // check if the message is a reply to another message
    if (cmdMessage.messageReference?.channelID && cmdMessage.messageReference.messageID && !singleMessage) {
      const replyMessage = await client.rest.channels
        .getMessage(cmdMessage.messageReference.channelID, cmdMessage.messageReference.messageID)
        .catch(() => undefined);
      if (replyMessage) {
        const replyResult = await checkImages(replyMessage, extraReturnTypes, video);
        if (replyResult) return replyResult;
      }
    }
    // then we check the current message
    const result = await checkImages(cmdMessage, extraReturnTypes, video);
    if (result) return result;
  }
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
      return;
    if (interaction?.authorizingIntegrationOwners?.[0] !== "0" && perms && !perms.has("READ_MESSAGE_HISTORY")) return;
    const messages = await channel.getMessages();
    // iterate over each message
    for (const message of messages) {
      const result = await checkImages(message, extraReturnTypes, video);
      if (result) return result;
    }
  }
};
