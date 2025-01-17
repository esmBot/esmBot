import { AttachmentFlags, PrivateChannel, TextableChannel, ThreadChannel } from "oceanic.js";
import { getType } from "./image.js";
import logger from "./logger.js";

const tenorURLs = [
  "tenor.com",
  "www.tenor.com"
];
const giphyURLs = [
  "giphy.com",
  "www.giphy.com",
  "i.giphy.com"
];
const giphyMediaURLs = [ // there could be more of these
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com"
];

const combined = [...tenorURLs, ...giphyURLs, ...giphyMediaURLs];

const providerUrls = [
  "https://tenor.co",
  "https://giphy.com"
];

const imageFormats = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "large"];
const videoFormats = ["video/mp4", "video/webm", "video/mov"];

/**
 * Gets proper image paths.
 * @param {string} image
 * @param {string} image2
 * @param {boolean} video
 * @param {boolean} [spoiler]
 * @param {boolean} [extraReturnTypes]
 * @param {string | null} [type]
 * @param {import("oceanic.js").Client | undefined } client
 * @returns {Promise<{ path: string; type?: string; url: string; name: string; spoiler: boolean; } | undefined>}
 */
const getImage = async (image, image2, video, spoiler = false, extraReturnTypes = false, type = null, client = undefined) => {
  let imageURL;
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
      spoiler
    };
  }
  const fileNameSplit = imageURL.pathname.split("/");
  const fileName = fileNameSplit[fileNameSplit.length - 1];
  const fileNameNoExtension = fileName.slice(0, fileName.lastIndexOf("."));
  const payload = {
    url: image2,
    path: image,
    name: fileNameNoExtension,
    spoiler
  };
  const host = new URL(image2).host;
  if (combined.includes(host)) {
    if (tenorURLs.includes(host)) {
      // Tenor doesn't let us access a raw GIF without going through their API,
      // so we use that if there's a key in the config
      if (process.env.TENOR !== "") {
        let id;
        if (image2.includes("tenor.com/view/")) {
          id = image2.split("-").pop();
        } else if (image2.endsWith(".gif")) {
          const redirect = (await fetch(image2, { method: "HEAD", redirect: "manual" })).headers.get("location");
          id = redirect?.split("-").pop();
        } else {
          return;
        }
        if (Number.isNaN(Number(id))) return;
        const data = await fetch(`https://tenor.googleapis.com/v2/posts?media_filter=gif&limit=1&client_key=esmBot%20${process.env.ESMBOT_VER}&key=${process.env.TENOR}&ids=${id}`);
        if (data.status === 429) {
          if (extraReturnTypes) {
            payload.type = "tenorlimit";
            return payload;
          }
        }
        const json = await data.json();
        if (json.error) throw Error(json.error.message);
        if (json.results.length === 0) return;
        payload.path = json.results[0].media_formats.gif.url;
      } else {
        return;
      }
    } else if (giphyURLs.includes(host)) {
      // Can result in an HTML page instead of a GIF
      payload.path = `https://media0.giphy.com/media/${image2.split("/")[4].split("-").pop()}/giphy.gif`;
    } else if (giphyMediaURLs.includes(host)) {
      payload.path = `https://media0.giphy.com/media/${image2.split("/")[4]}/giphy.gif`;
    }
    payload.type = "image/gif";
  } else {
    let result;
    if ((imageURL.host === "cdn.discordapp.com" || imageURL.host === "media.discordapp.net") && (imageURL.pathname.match(/^\/attachments\/\d+\/\d+\//))) {
      let url;
      if (client && isAttachmentExpired(imageURL)) {
        const refreshed = await client.rest.misc.refreshAttachmentURLs([image]);
        url = new URL(refreshed.refreshedURLs[0].refreshed);
      } else {
        url = new URL(image);
      }
      url.searchParams.set("animated", "true");
      result = await getType(url, extraReturnTypes);
    } else {
      result = await getType(imageURL, extraReturnTypes);
    }
    if (!result) return;
    if (result.url) payload.path = result.url;
    payload.type = type ?? result.type;
    if (!payload.type || ((video ? !videoFormats.includes(payload.type) : true) && !imageFormats.includes(payload.type))) return;
  }
  return payload;
};

/**
 * Checks a single message for stickers, videos, or images
 * @param {import("oceanic.js").Message} message 
 * @param {boolean} extraReturnTypes 
 * @param {boolean} video 
 * @param {boolean} sticker 
 * @returns {Promise<{ path: string; type?: string; url: string; name: string; } | import("oceanic.js").StickerItem | undefined>}
 */
const checkImages = async (message, extraReturnTypes, video, sticker) => {
  let type;
  if (sticker && message.stickerItems) {
    type = message.stickerItems[0];
  } else {
    // first check the embeds
    if (message.embeds.length !== 0) {
      let hasSpoiler = false;
      if (message.embeds[0].url && message.content) {
        const spoilerRegex = /\|\|.*https?:\/\/.*\|\|/s;
        hasSpoiler = spoilerRegex.test(message.content);
      }
      // embeds can vary in types, we check for gifvs first
      if (message.embeds[0].provider?.url && providerUrls.includes(message.embeds[0].provider?.url) && message.embeds[0].video?.url && message.embeds[0].url) {
        type = await getImage(message.embeds[0].video.url, message.embeds[0].url, video, hasSpoiler, extraReturnTypes);
      // then thumbnails
      } else if (message.embeds[0].thumbnail) {
        type = await getImage(message.embeds[0].thumbnail.proxyURL ?? message.embeds[0].thumbnail.url, message.embeds[0].thumbnail.url, video, hasSpoiler, extraReturnTypes);
      // and finally direct images
      } else if (message.embeds[0].image) {
        type = await getImage(message.embeds[0].image.proxyURL ?? message.embeds[0].image.url, message.embeds[0].image.url, video, hasSpoiler, extraReturnTypes);
      }
      // then check the attachments
    } else if (message.attachments.size !== 0) {
      const firstAttachment = message.attachments.first();
      if (firstAttachment?.width) type = await getImage(firstAttachment.proxyURL, firstAttachment.url, video, !!(firstAttachment.flags & AttachmentFlags.IS_SPOILER));
    }
  }
  // if the return value exists then return it
  return type;
};

/**
 * Checks whether an attachment URL has already expired
 * @param {URL} url
 * @returns {boolean}
 */
function isAttachmentExpired(url) {
  try {
    const expiry = url.searchParams.get("ex");
    return !expiry 
      || expiry.length > 8 
      || Date.now() >= Number(`0x${expiry}`) * 1000;
  } catch {
    // ignore invalid expiration dates
  }
  return true;
}

/**
 * Checks for the latest message containing an image and returns the URL of the image.
 * @param {import("oceanic.js").Client} client
 * @param {import("oceanic.js").Message | undefined} cmdMessage
 * @param {import("oceanic.js").CommandInteraction | undefined} interaction
 * @param {{ image: string; link: any; }} options
 * @returns {Promise<{ path: string; type?: string; url: string; name: string; } | import("oceanic.js").StickerItem | undefined>}
 */
export default async (client, cmdMessage, interaction, options, extraReturnTypes = false, video = false, sticker = false, singleMessage = false) => {
  // we start by determining whether or not we're dealing with an interaction or a message
  if (interaction && options) {
    // we can get a raw attachment or a URL in the interaction itself
    if (options.image) {
      const attachment = interaction.data.resolved.attachments.get(options.image);
      if (attachment) {
        return getImage(attachment.proxyURL, attachment.url, video, !!(attachment.flags & AttachmentFlags.IS_SPOILER), !!attachment.contentType);
      }
    } else if (options.link) {
      return getImage(options.link, options.link, video, false, extraReturnTypes, null, interaction.client);
    }
  }
  if (cmdMessage) {
    // check if the message is a reply to another message
    if (cmdMessage.messageReference?.channelID && cmdMessage.messageReference.messageID && !singleMessage) {
      const replyMessage = await client.rest.channels.getMessage(cmdMessage.messageReference.channelID, cmdMessage.messageReference.messageID).catch(() => undefined);
      if (replyMessage) {
        const replyResult = await checkImages(replyMessage, extraReturnTypes, video, sticker);
        if (replyResult) return replyResult;
      }
    }
    // then we check the current message
    const result = await checkImages(cmdMessage, extraReturnTypes, video, sticker);
    if (result) return result;
  }
  if (!singleMessage && (cmdMessage || interaction?.authorizingIntegrationOwners?.[0] !== undefined)) {
    // if there aren't any replies or interaction attachments then iterate over the last few messages in the channel
    const channel = (interaction ? interaction : cmdMessage)?.channel ?? await client.rest.channels.get((interaction ? interaction : cmdMessage).channelID).catch(e => {
      logger.warn(`Failed to get a text channel: ${e}`);
    });
    if (!(channel instanceof TextableChannel) && !(channel instanceof ThreadChannel) && !(channel instanceof PrivateChannel)) return;
    const perms = (channel instanceof TextableChannel || channel instanceof ThreadChannel) ? channel.permissionsOf?.(client.user.id) : null;
    if (perms && !perms.has("VIEW_CHANNEL")) return;
    const messages = await channel.getMessages();
    // iterate over each message
    for (const message of messages) {
      const result = await checkImages(message, extraReturnTypes, video, sticker);
      if (result) return result;
    }
  }
};
