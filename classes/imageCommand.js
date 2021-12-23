import Command from "./command.js";
import imageDetect from "../utils/imagedetect.js";
import { runningCommands } from "../utils/collections.js";
import { readFileSync } from "fs";
const { emotes } = JSON.parse(readFileSync(new URL("../messages.json", import.meta.url)));
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
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (runningCommands.has(this.message.author.id) && (new Date(runningCommands.get(this.message.author.id)) - new Date(this.message.createdAt)) < 5000) {
      return "Please slow down a bit.";
    }
    // before awaiting the command result, add this command to the set of running commands
    runningCommands.set(this.message.author.id, this.message.createdAt);
  
    const magickParams = {
      cmd: this.constructor.command,
      params: {}
    };

    if (this.constructor.requiresImage) {
      try {
        const image = await imageDetect(this.client, this.message, true);
        if (image === undefined) {
          runningCommands.delete(this.message.author.id);
          return this.constructor.noImage;
        } else if (image.type === "large") {
          runningCommands.delete(this.message.author.id);
          return "That image is too large (>= 25MB)! Try using a smaller image.";
        } else if (image.type === "tenorlimit") {
          runningCommands.delete(this.message.author.id);
          return "I've been rate-limited by Tenor. Please try uploading your GIF elsewhere.";
        }
        magickParams.path = image.path;
        magickParams.params.type = image.type;
        magickParams.url = image.url; // technically not required but can be useful for text filtering
        magickParams.params.delay = image.delay ? image.delay : 0;
        if (this.constructor.requiresGIF) magickParams.onlyGIF = true;
      } catch (e) {
        runningCommands.delete(this.message.author.id);
        throw e;
      }
      
    }

    if (this.constructor.requiresText) {
      if (this.args.length === 0 || !await this.criteria(this.args)) {
        runningCommands.delete(this.message.author.id);
        return this.constructor.noText;
      }
    }

    switch (typeof this.params) {
      case "function":
        Object.assign(magickParams.params, this.params(magickParams.url, magickParams.delay));
        break;
      case "object":
        Object.assign(magickParams.params, this.params);
        break;
    }

    let status;
    if (magickParams.params.type === "image/gif") {
      status = await this.processMessage(this.message);
    } else {
      this.client.sendChannelTyping(this.message.channel.id);
    }

    try {
      const { buffer, type } = await this.ipc.command("image", { type: "run", obj: magickParams }, true).catch(e => {
        throw e;
      });
      if (type === "nogif" && this.constructor.requiresGIF) return "That isn't a GIF!";
      return {
        file: Buffer.from(buffer.data),
        name: `${this.constructor.command}.${type}`
      };
    } catch (e) {
      if (e === "Job timed out") return "The image is taking too long to process (>=15 minutes), so the job was cancelled. Try using a smaller image.";
      if (e.toString().includes("Not connected to image server") || e === "No available servers") return "I can't seem to contact the image servers, they might be down or still trying to start up. Please wait a little bit.";
      throw e;
    } finally {
      if (status && await this.client.getMessage(status.channel.id, status.id).catch(() => undefined)) await status.delete();
      runningCommands.delete(this.message.author.id);
    }
    
  }

  processMessage(message) {
    return this.client.createMessage(message.channel.id, `${random(emotes) || process.env.PROCESSING_EMOJI || "<a:processing:479351417102925854>"} Processing... This might take a while`);
  }

  static requiresImage = true;
  static requiresText = false;
  static requiresGIF = false;
  static noImage = "You need to provide an image!";
  static noText = "You need to provide some text!";
  static command = "";
}

export default ImageCommand;
