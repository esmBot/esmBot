const Command = require("./command.js");
const magick = require("../utils/image.js");
const imageDetect = require("../utils/imagedetect.js");

class ImageCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);

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
  }

  async run() {
    const magickParams = {
      cmd: this.constructor.command
    };

    if (this.constructor.requiresImage) {
      const image = await imageDetect(this.message);
      if (image === undefined) return `${this.message.author.mention}, ${this.constructor.noImage}`;
      magickParams.path = image.path;
      magickParams.type = image.type;
    }

    if (this.constructor.requiresText) {
      if (this.args.length === 0) return `${this.message.author.mention}, ${this.constructor.noText}`;
    }

    switch (typeof this.params) {
      case "function":
        Object.assign(magickParams, this.params(this.args));
        break;
      case "object":
        Object.assign(magickParams, this.params);
        break;
    }

    const status = await this.processMessage(this.message);

    try {
      const { buffer, type } = await magick.run(magickParams);
      if (status.channel.messages.get(status.id)) await status.delete();
      return {
        file: buffer,
        name: `${this.constructor.command}.${type}`
      };
    } catch (e) {
      if (status.channel.messages.get(status.id)) await status.delete();
      throw e;
    }
    
  }

  processMessage(message) {
    return message.channel.createMessage(`${process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`);
  }

  static requiresImage = true;
  static requiresText = false;
  static noImage = "you need to provide an image!";
  static noText = "you need to provide some text!";
  static command = "";
}

module.exports = ImageCommand;