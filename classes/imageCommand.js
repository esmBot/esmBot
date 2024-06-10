import Command from "./command.js";
import imageDetect from "../utils/imagedetect.js";
import { runImageJob } from "../utils/image.js";
import { runningCommands } from "../utils/collections.js";
import { clean, isEmpty, random } from "../utils/misc.js";
import { selectedImages } from "../utils/collections.js";
import messages from "../config/messages.json" with { type: "json" };
import { Constants, CommandInteraction } from "oceanic.js";

class ImageCommand extends Command {
  /**
   * @param {string} _text
   * @param {string} _url
   */
  async criteria(_text, _url) {
    return true;
  }

  async run() {
    this.success = false;
    const timestamp = this.type === "application" && this.interaction ? CommandInteraction.getCreatedAt(this.interaction.id) : this.message?.createdAt ?? new Date();
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (runningCommands.has(this.author?.id) && (runningCommands.get(this.author?.id).getTime() - timestamp.getTime()) < 5000) {
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

    if (this.type === "application") await this.acknowledge(this.options.ephemeral ? 64 : undefined);

    let needsSpoiler = false;
    if (this.constructor.requiresImage) {
      try {
        const selection = selectedImages.get(this.author.id);
        const image = selection ?? await imageDetect(this.client, this.message, this.interaction, this.options, true).catch(e => {
          if (e.name === "AbortError") return { type: "timeout" };
          throw e;
        });
        if (selection) selectedImages.delete(this.author.id);
        if (image === undefined) {
          runningCommands.delete(this.author.id);
          return `${this.constructor.noImage} (Tip: try right-clicking/holding on a message and press Apps -> Select Image, then try again.)`;
        }
        needsSpoiler = image.spoiler;
        if (image.type === "large") {
          runningCommands.delete(this.author.id);
          return "That image is too large (>= 40MB)! Try using a smaller image.";
        }
        if (image.type === "tenorlimit") {
          runningCommands.delete(this.author.id);
          return "I've been rate-limited by Tenor. Please try uploading your GIF elsewhere.";
        }
        if (image.type === "timeout") {
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

    if ("spoiler" in this.options) needsSpoiler = this.options.spoiler;

    if (this.constructor.requiresText) {
      const text = this.options.text ?? this.args.join(" ").trim();
      if (isEmpty(text) || !await this.criteria(text, imageParams.url)) {
        runningCommands.delete(this.author?.id);
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
      if (type === "ratelimit") return "I've been ratelimited by the server hosting that image. Try uploading your image somewhere else.";
      if (type === "nocmd") return "That command isn't supported on this instance of esmBot.";
      if (type === "nogif" && this.constructor.requiresGIF) return "That isn't a GIF!";
      if (type === "empty") return this.constructor.empty;
      this.success = true;
      if (type === "text") return {
        content: `\`\`\`\n${await clean(buffer.toString("utf8"))}\n\`\`\``,
        flags: this.options.ephemeral ? 64 : undefined
      };
      return {
        contents: buffer,
        name: `${needsSpoiler ? "SPOILER_" : ""}${this.constructor.command}.${type}`,
        flags: this.options.ephemeral ? 64 : undefined
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
      runningCommands.delete(this.author?.id);
    }

  }

  processMessage(channel) {
    return channel.createMessage({
      content: `${random(messages.emotes) || process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`
    });
  }

  static init() {
    this.flags = [];
    if (this.requiresText || this.textOptional) {
      this.flags.push({
        name: "text",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description: "The text to put on the image",
        required: !this.textOptional,
        classic: true
      });
    }
    if (this.requiresImage) {
      this.flags.push({
        name: "image",
        type: Constants.ApplicationCommandOptionTypes.ATTACHMENT,
        description: "An image/GIF attachment"
      }, {
        name: "link",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description: "An image/GIF URL"
      });
    }
    if (!this.alwaysGIF) {
      this.flags.push({
        name: "togif",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Force GIF output"
      })
    }

    this.flags.push({
      name: "spoiler",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Attempt to send output as a spoiler"
    }, {
      name: "ephemeral",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      description: "Attempt to send output as an ephemeral/temporary response"
    });
    return this;
  }

  static allowedFonts = ["futura", "impact", "helvetica", "arial", "roboto", "noto", "times", "comic sans ms"];

  static requiresImage = true;
  static requiresText = false;
  static textOptional = false;
  static requiresGIF = false;
  static alwaysGIF = false;
  static noImage = "You need to provide an image/GIF!";
  static noText = "You need to provide some text!";
  static empty = "The resulting output was empty!";
  static command = "";
}

export default ImageCommand;
