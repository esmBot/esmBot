const Command = require("./command.js");
const magick = require("../utils/image.js");
const imageDetect = require("../utils/imagedetect.js");
const collections = require("../utils/collections.js");
const { emotes } = require("../messages.json");
const { random } = require("../utils/misc.js");

class ImageCommand extends Command {
  /*this.embed = {
      "title": "Your image is being generated! (PRELIMINARY EMBED)",
      "description": "The current progress is outlined below:",
      "color": 16711680,
      "footer": {
        "text": "Step 2/3"
      },
      "author": {
        "name": "Processing...",
        "icon_url": "https://cdn.discordapp.com/avatars/429305856241172480/a20f739886ae47cfb10fa069416e8ed3.jpg"
      },
      "fields": [
        {
          "name": "Downloading...",
          "value": "✅ Done!"
        },
        {
          "name": "Processing...",
          "value": "<a:processing:818243325891051581> In progress"
        },
        {
          "name": "Uploading...",
          "value": "<a:processing:818243325891051581> Waiting for previous steps to complete"
        }
      ]
    };*/

  async criteria() {
    return true;
  }

  async run() {
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (collections.runningCommands.has(this.message.author.id) && (new Date(collections.runningCommands.get(this.message.author.id)) - new Date(this.message.createdAt)) < 5000) {
      return `${this.message.author.mention}, please slow down a bit.`;
    }
    // before awaiting the command result, add this command to the set of running commands
    collections.runningCommands.set(this.message.author.id, this.message.createdAt);
  
    const magickParams = {
      cmd: this.constructor.command
    };

    if (this.constructor.requiresImage) {
      try {
        const image = await imageDetect(this.client, this.message);
        if (image === undefined) {
          collections.runningCommands.delete(this.message.author.id);
          return `${this.message.author.mention}, ${this.constructor.noImage}`;
        }
        magickParams.path = image.path;
        magickParams.type = image.type;
        magickParams.url = image.url; // technically not required but can be useful for text filtering
        magickParams.delay = image.delay ? image.delay : 0;
        if (this.constructor.requiresGIF) magickParams.onlyGIF = true;
      } catch (e) {
        collections.runningCommands.delete(this.message.author.id);
        throw e;
      }
      
    }

    if (this.constructor.requiresText) {
      if (this.args.length === 0 || !await this.criteria(this.args)) {
        collections.runningCommands.delete(this.message.author.id);
        return `${this.message.author.mention}, ${this.constructor.noText}`;
      }
    }

    switch (typeof this.params) {
      case "function":
        Object.assign(magickParams, this.params(this.args, magickParams.url));
        break;
      case "object":
        Object.assign(magickParams, this.params);
        break;
    }

    let status;
    if (magickParams.type === "image/gif") {
      status = await this.processMessage(this.message);
    } else {
      this.client.sendChannelTyping(this.message.channel.id);
    }

    try {
      const { buffer, type } = await magick.run(magickParams).catch(e => {
        throw e;
      });
      if (type === "nogif" && this.constructor.requiresGIF) return `${this.message.author.mention}, that isn't a GIF!`;
      return {
        file: buffer,
        name: `${this.constructor.command}.${type}`
      };
    } catch (e) {
      if (e.toString().includes("Not connected to image server")) return `${this.message.author.mention}, I'm still trying to connect to the image servers. Please wait a little bit.`;
      throw e;
    } finally {
      if (status && await this.client.getMessage(status.channel.id, status.id).catch(() => undefined)) await status.delete();
      collections.runningCommands.delete(this.message.author.id);
    }
    
  }

  processMessage(message) {
    return this.client.createMessage(message.channel.id, `${random(emotes) || process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`);
  }

  static requiresImage = true;
  static requiresText = false;
  static requiresGIF = false;
  static noImage = "you need to provide an image!";
  static noText = "you need to provide some text!";
  static command = "";
}

module.exports = ImageCommand;