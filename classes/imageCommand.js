import Command from "./command.js";
import imageDetect from "../utils/imagedetect.js";
import { runningCommands } from "../utils/collections.js";
import { readFileSync } from "fs";
const { emotes } = JSON.parse(readFileSync(new URL("../config/messages.json", import.meta.url)));
import { random } from "../utils/misc.js";

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
    const timestamp = this.type === "classic" ? this.message.createdAt : Math.floor((this.interaction.id / 4194304) + 1420070400000);
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (runningCommands.has(this.author.id) && (new Date(runningCommands.get(this.author.id)) - new Date(timestamp)) < 5000) {
      return "Please slow down a bit.";
    }
    // before awaiting the command result, add this command to the set of running commands
    runningCommands.set(this.author.id, timestamp);

    const magickParams = {
      cmd: this.constructor.command,
      params: {}
    };

    if (this.type === "application") {
      await this.acknowledge();
    }

    if (this.constructor.requiresImage) {
      try {
        const image = await imageDetect(this.client, this.message, this.interaction, this.options, true);
        if (image === undefined) {
          runningCommands.delete(this.author.id);
          return this.constructor.noImage;
        } else if (image.type === "large") {
          runningCommands.delete(this.author.id);
          return "That image is too large (>= 25MB)! Try using a smaller image.";
        } else if (image.type === "tenorlimit") {
          runningCommands.delete(this.author.id);
          return "I've been rate-limited by Tenor. Please try uploading your GIF elsewhere.";
        }
        magickParams.path = image.path;
        magickParams.params.type = image.type;
        magickParams.url = image.url; // technically not required but can be useful for text filtering
        magickParams.name = image.name;
        if (this.constructor.requiresGIF) magickParams.onlyGIF = true;
      } catch (e) {
        runningCommands.delete(this.author.id);
        throw e;
      }
    }

    if (this.constructor.requiresText) {
      const text = this.options.text ?? this.args;
      if (text.length === 0 || !await this.criteria(text)) {
        runningCommands.delete(this.author.id);
        return this.constructor.noText;
      }
    }

    switch (typeof this.params) {
      case "function":
        Object.assign(magickParams.params, this.params(magickParams.url, magickParams.name));
        break;
      case "object":
        Object.assign(magickParams.params, this.params);
        break;
    }

    let status;
    if (magickParams.params.type === "image/gif" && this.type === "classic") {
      status = await this.processMessage(this.message);
    }

    try {
      const { buffer, type } = await this.ipc.serviceCommand("image", { type: "run", obj: magickParams }, true, 9000000);
      if (type === "nogif" && this.constructor.requiresGIF) return "That isn't a GIF!";
      return {
        file: Buffer.from(buffer.data),
        name: `${this.constructor.command}.${type}`
      };
    } catch (e) {
      if (e === "Request ended prematurely due to a closed connection") return "This image job couldn't be completed because the server it was running on went down. Try running your command again.";
      if (e === "Job timed out" || e === "Timeout") return "The image is taking too long to process (>=15 minutes), so the job was cancelled. Try using a smaller image.";
      if (e === "No available servers") return "I can't seem to contact the image servers, they might be down or still trying to start up. Please wait a little bit.";
      throw e;
    } finally {
      if (status && (status.channel.messages ? status.channel.messages.has(status.id) : await this.client.getMessage(status.channel.id, status.id).catch(() => undefined))) await status.delete();
      runningCommands.delete(this.author.id);
    }

  }

  processMessage(message) {
    return this.client.createMessage(message.channel.id, `${random(emotes) || process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`);
  }

  static init() {
    this.flags = [];
    if (this.requiresText || this.textOptional) {
      this.flags.push({
        name: "text",
        type: 3,
        description: "The text to put on the image",
        required: !this.textOptional
      });
    }
    if (this.requiresImage) {
      this.flags.push({
        name: "image",
        type: 11,
        description: "An image/GIF attachment"
      }, {
        name: "link",
        type: 3,
        description: "An image/GIF URL"
      });
    }
    return this;
  }

  static allowedFonts = ["futura", "impact", "helvetica", "arial", "roboto", "noto", "times", "comic sans ms"];

  static requiresImage = true;
  static requiresText = false;
  static textOptional = false;
  static requiresGIF = false;
  static noImage = "You need to provide an image/GIF!";
  static noText = "You need to provide some text!";
  static command = "";
}

export default ImageCommand;
