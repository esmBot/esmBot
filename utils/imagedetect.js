const fetch = require("node-fetch");
const execPromise = require("util").promisify(require("child_process").exec);

// gets the proper image paths
const getImage = async (image, image2, gifv = false) => {
  try {
    const payload = {
      url: image2,
      path: image
    };
    if (gifv) {
      if (image2.includes("tenor.com")) {
        if (process.env.TENOR !== "") {
          const data = await fetch(`https://api.tenor.com/v1/gifs?ids=${image2.split("-").pop()}&key=${process.env.TENOR}`);
          const json = await data.json();
          payload.path = json.results[0].media[0].gif.url;
        } else {
          const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${image}`)).stdout.replace("\n", "");
          payload.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
        }
      } else if (image2.includes("giphy.com")) {
        payload.path = `https://media0.giphy.com/media/${image2.split("-").pop()}/giphy.gif`;
      } else if (image2.includes("imgur.com")) {
        payload.path = image.replace(".mp4", ".gif");
      }
      payload.type = "image/gif";
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

const checkImages = async (message) => {
  let type;
  // first check the embeds
  if (message.embeds.length !== 0) {
    // embeds can vary in types, we check for tenor gifs first
    if (message.embeds[0].type === "gifv") {
      type = await getImage(message.embeds[0].video.url, message.embeds[0].url, true);
    // then we check for other image types
    } else if (message.embeds[0].type === "video" || message.embeds[0].type === "image") {
      type = await getImage(message.embeds[0].thumbnail.proxy_url, message.embeds[0].thumbnail.url);
    // finally we check both possible image fields for "generic" embeds
    } else if (message.embeds[0].type === "rich") {
      if (message.embeds[0].thumbnail) {
        type = await getImage(message.embeds[0].thumbnail.proxy_url, message.embeds[0].thumbnail.url);
      } else if (message.embeds[0].image) {
        type = await getImage(message.embeds[0].image.proxy_url, message.embeds[0].image.url);
      }
    }
  // then check the attachments
  } else if (message.attachments.length !== 0 && message.attachments[0].width) {
    type = await getImage(message.attachments[0].proxy_url, message.attachments[0].url);
  }
  // if the file is an image then return it
  return type ? type : false;
};

// this checks for the latest message containing an image and returns the url of the image
module.exports = async (cmdMessage) => {
  // we start by checking the current message for images
  const result = await checkImages(cmdMessage);
  if (result !== false) return result;
  // if there aren't any then iterate over the last few messages in the channel
  const messages = await cmdMessage.channel.getMessages();
  // iterate over each message
  for (const message of messages) {
    const result = await checkImages(message);
    if (result === false) {
      continue;
    } else {
      return result;
    }
  }
};
