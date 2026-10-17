import { Message } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { pendingCommands, selectedImages } from "#utils/collections.js";
import { request } from "#utils/media.js";
import mediaDetect from "#utils/mediadetect.js";
import { awaitRerun, rerunButton } from "#utils/rerunprompt.js";

class SelectImageCommand extends Command {
  async run() {
    const message = this.interaction?.data.target;
    if (!(message instanceof Message)) throw Error("Target is not a message");
    const mediaArr = await mediaDetect(this.client, this.permissions, message, this.interaction, true).catch((e) => {
      if (e.name === "AbortError") return this.getString("image.timeout");
      throw e;
    });
    this.success = false;
    if (typeof mediaArr === "string") return mediaArr;
    if (mediaArr.length === 0) return this.getString("image.couldNotFind");

    let final;
    for (const media of mediaArr) {
      const type = await request(new URL(media.path), ["image"], true).catch(() => {});
      if (type) {
        final = media;
        break;
      }
    }
    if (!final) return this.getString("image.couldNotFind");

    selectedImages.set(this.author.id, final);

    const pending = pendingCommands.get(this.author.id);
    if (!pending) return this.getString("image.selected");
    return {
      content: this.getString("image.selected"),
      components: rerunButton(pending.cmdName, this.locale),
    };
  }

  /**
   * @param {Message} [res]
   */
  async finalize(res) {
    if (!res?.components.length || !this.interaction) return;
    const pending = pendingCommands.get(this.author.id);
    if (!pending) return;
    pendingCommands.delete(this.author.id);
    awaitRerun(this.interaction, res, pending);
  }

  static ephemeral = true;
}

export default SelectImageCommand;
