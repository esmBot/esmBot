const fetch = require("node-fetch");
const { getType } = require("./image.js");
const execPromise = require("util").promisify(require("child_process").exec);

const tenorURLs = [
  "tenor.com",
  "www.tenor.com"
];
const giphyURLs = [
  "giphy.com",
  "www.giphy.com"
];
const imgurURLs = [
  "imgur.com",
  "www.imgur.com",
  "i.imgur.com"
];
const gfycatURLs = [
  "gfycat.com",
  "www.gfycat.com",
  "thumbs.gfycat.com",
  "giant.gfycat.com"
];

const imageFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoFormats = ["video/mp4", "video/webm", "video/mov"];

// gets the proper image paths
const getImage = async (image, image2, video, gifv = false) => {
  try {
    const payload = {
      url: image2,
      path: image
    };
    if (gifv) {
      const host = new URL(image2).host;
      if (tenorURLs.includes(host)) {
        // Tenor doesn't let us access a raw GIF without going through their API,
        // so we use that if there's a key in the config and fall back to using the MP4 if there isn't
        // Note that MP4 conversion requires an ImageMagick build that supports MPEG decoding
        if (process.env.TENOR !== "") {
          const data = await fetch(`https://api.tenor.com/v1/gifs?ids=${image2.split("-").pop()}&key=${process.env.TENOR}`);
          const json = await data.json();
          payload.path = json.results[0].media[0].gif.url;
        } else {
          const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${image}`)).stdout.replace("\n", "");
          payload.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
        }
      } else if (giphyURLs.includes(host)) {
        // Can result in an HTML page instead of a GIF
        payload.path = `https://media0.giphy.com/media/${image2.split("-").pop()}/giphy.gif`;
      } else if (imgurURLs.includes(host)) {
        // Seems that Tenor has a possibility of making GIFs static
        payload.path = image.replace(".mp4", ".gif");
      } else if (gfycatURLs.includes(host)) {
        // iirc Gfycat also seems to sometimes make GIFs static
        payload.path = `https://thumbs.gfycat.com/${image.split("/").pop().split(".mp4")[0]}-size_restricted.gif`;
      }
      payload.type = "image/gif";
    } else if (video) {
      payload.type = await getType(payload.path);
      if (!payload.type || (!videoFormats.includes(payload.type) && !imageFormats.includes(payload.type))) return;
    } else {
      payload.type = await getType(payload.path);
      if (!payload.type || !imageFormats.includes(payload.type)) return;
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw Error("Timed out");
    } else {
      throw error;
    }
  }
};

const checkImages = async (message, video) => {
  let type;
  // first check the embeds
  if (message.embeds.length !== 0) {
    // embeds can vary in types, we check for tenor gifs first
    if (message.embeds[0].type === "gifv") {
      type = await getImage(message.embeds[0].video.url, message.embeds[0].url, video, true);
    // then we check for other image types
    } else if ((message.embeds[0].type === "video" || message.embeds[0].type === "image") && message.embeds[0].thumbnail) {
      type = await getImage(message.embeds[0].thumbnail.proxy_url, message.embeds[0].thumbnail.url, video);
    // finally we check both possible image fields for "generic" embeds
    } else if (message.embeds[0].type === "rich") {
      if (message.embeds[0].thumbnail) {
        type = await getImage(message.embeds[0].thumbnail.proxy_url, message.embeds[0].thumbnail.url, video);
      } else if (message.embeds[0].image) {
        type = await getImage(message.embeds[0].image.proxy_url, message.embeds[0].image.url, video);
      }
    }
  // then check the attachments
  } else if (message.attachments.length !== 0 && message.attachments[0].width) {
    type = await getImage(message.attachments[0].proxy_url, message.attachments[0].url, video);
  }
  // if the file is an image then return it
  return type ? type : false;
};

// this checks for the latest message containing an image and returns the url of the image
module.exports = async (client, cmdMessage, video = false) => {
  // we start by checking if the message is a reply to another message
  if (cmdMessage.messageReference) {
    const replyMessage = await client.getMessage(cmdMessage.messageReference.channelID, cmdMessage.messageReference.messageID);
    if (replyMessage) {
      const replyResult = await checkImages(replyMessage, video);
      if (replyResult !== false) return replyResult;
    }
  }
  // then we check the current message
  const result = await checkImages(cmdMessage, video);
  if (result !== false) return result;
  // if there aren't any replies then iterate over the last few messages in the channel
  const messages = await cmdMessage.channel.getMessages();
  // iterate over each message
  for (const message of messages) {
    const result = await checkImages(message, video);
    if (result === false) {
      continue;
    } else {
      return result;
    }
  }
};
