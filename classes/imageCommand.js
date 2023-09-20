import Command from "./command.js";
import imageDetect from "../utils/imagedetect.js";
import { runImageJob } from "../utils/image.js";
import { runningCommands } from "../utils/collections.js";
import { readFileSync } from "fs";
const { emotes } = JSON.parse(readFileSync(new URL("../config/messages.json", import.meta.url)));
import { random } from "../utils/misc.js";
import { selectedImages } from "../utils/collections.js";

class ImageCommand extends Command {
  async criteria() {
    return true;
  }

  async run() {
    this.success = false;
    const timestamp = this.type === "classic" ? this.message.createdAt : Math.floor((this.interaction.id / 4194304) + 1420070400000);
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (runningCommands.has(this.author.id) && (new Date(runningCommands.get(this.author.id)) - new Date(timestamp)) < 5000) {
      return "Please slow down a bit.";
    }
    // before awaiting the command result, add this command to the set of running commands
    runningCommands.set(this.author.id, timestamp);

    const imageParams = {
      cmd: this.constructor.command,
      params: {
        togif: !!this.options.togif
      },
      id: (this.interaction ?? this.message).id
    };

    if (this.type === "application") await this.acknowledge();

    if (this.constructor.requiresImage) {
      try {
        const selection = selectedImages.get(this.author.id);
        const image = selection ?? await imageDetect(this.client, this.message, this.interaction, this.options, true).catch(e => {
          if (e.name === "AbortError") {
            return { type: "timeout" };
          } else {
            throw e;
          }
        });
        if (selection) selectedImages.delete(this.author.id);
        if (image === undefined) {
          runningCommands.delete(this.author.id);
          return `${this.constructor.noImage} (Tip: try right-clicking/holding on a message and press Apps -> Select Image, then try again.)`;
        } else if (image.type === "large") {
          runningCommands.delete(this.author.id);
          return "That image is too large (>= 40MB)! Try using a smaller image.";
        } else if (image.type === "tenorlimit") {
          runningCommands.delete(this.author.id);
          return "I've been rate-limited by Tenor. Please try uploading your GIF elsewhere.";
        } else if (image.type === "timeout") {
          runningCommands.delete(this.author.id);
          return "The request to get that image timed out. Please try again, upload your image elsewhere, or use another image.";
        }
        imageParams.path = image.path;
        imageParams.params.type = image.type;
        imageParams.url = image.url; // technically not required but can be useful for text filtering
        imageParams.name = image.name;
        if (this.constructor.requiresGIF) imageParams.onlyGIF = true;
      } catch (e) {
        runningCommands.delete(this.author.id);
        throw e;
      }
    }

    if (this.constructor.requiresText) {
      const text = this.options.text ?? this.args.join(" ").trim();
      if (text.length === 0 || !await this.criteria(text, imageParams.url)) {
        runningCommands.delete(this.author.id);
        return this.constructor.noText;
      }
    }

    if (typeof this.params === "function") {
      Object.assign(imageParams.params, this.params(imageParams.url, imageParams.name));
    } else if (typeof this.params === "object") {
      Object.assign(imageParams.params, this.params);
    }

    let status;
    if (imageParams.params.type === "image/gif" && this.type === "classic") {
      status = await this.processMessage(this.message.channel ?? await this.client.rest.channels.get(this.message.channelID));
    }

    try {
      const { buffer, type } = await runImageJob(imageParams);
      if (type === "nocmd") return "That command isn't supported on this instance of esmBot.";
      if (type === "nogif" && this.constructor.requiresGIF) return "That isn't a GIF!";
      this.success = true;
      return {
        contents: buffer,
        name: `${this.constructor.command}.${type}`
      };
    } catch (e) {
      if (e === "Request ended prematurely due to a closed connection") return "This image job couldn't be completed because the server it was running on went down. Try running your command again.";
      if (e === "Job timed out" || e === "Timeout") return "The image is taking too long to process (>=15 minutes), so the job was cancelled. Try using a smaller image.";
      if (e === "No available servers") return "I can't seem to contact the image servers, they might be down or still trying to start up. Please wait a little bit.";
      throw e;
    } finally {
      try {
        if (status) await status.delete();
      } catch {
        // no-op
      }
      runningCommands.delete(this.author.id);
    }

  }

  processMessage(channel) {
    return channel.createMessage({
      content: `${random(emotes) || process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`
    });
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
    this.flags.push({
      name: "togif",
      type: 5,
      description: "Force GIF output"
    });
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
