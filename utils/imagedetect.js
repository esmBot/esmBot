const fetch = require("node-fetch");

// gets the proper image paths
const getImage = async (image, image2, gifv = false) => {
  try {
    let requestImage = image;
    if (gifv) {
      if (image2.includes("tenor.com") && process.env.TENOR !== "") {
        const data = await fetch(`https://api.tenor.com/v1/gifs?ids=${image2.split("-").pop()}&key=${process.env.TENOR}`);
        const json = await data.json();
        console.log(json.results[0].media[0].gif.url);
        requestImage = json.results[0].media[0].gif.url;
      } else if (image2.includes("giphy.com")) {
        requestImage = `https://media0.giphy.com/media/${image2.split("-").pop()}/giphy.gif`;
      } else if (image2.includes("imgur.com")) {
        requestImage = image.replace(".mp4", ".gif");
      }
    }
    const payload = {
      url: image2,
      path: requestImage
    };
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
