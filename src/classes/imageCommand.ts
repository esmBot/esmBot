import {
  type AnyTextableChannel,
  type Attachment,
  CommandInteraction,
  Constants,
  type JSONAttachment,
  type Message,
  type RawAttachment,
  type User,
} from "oceanic.js";
import messages from "#config/messages.json" with { type: "json" };
import { runningCommands, selectedImages } from "#utils/collections.js";
import { getAllLocalizations } from "#utils/i18n.js";
import { runImageJob } from "#utils/image.js";
import imageDetect, { type ImageMeta } from "#utils/imagedetect.js";
import { clean, isEmpty, random } from "#utils/misc.js";
import type { ImageParams } from "#utils/types.js";
import Command from "./command.ts";

class ImageCommand extends Command {
  params?: object;

  paramsFunc(_url?: string, _name?: string): object {
    return {};
  }

  async criteria(_text?: string | number | boolean | User | Attachment, _url?: string) {
    return true;
  }

  async run() {
    this.success = false;

    if (!this.permissions.has("ATTACH_FILES")) return this.getString("permissions.noAttachFiles");

    const timestamp =
      this.type === "application" && this.interaction
        ? CommandInteraction.getCreatedAt(this.interaction.id)
        : (this.message?.createdAt ?? new Date());
    // check if this command has already been run in this channel with the same arguments, and we are awaiting its result
    // if so, don't re-run it
    if (
      runningCommands.has(this.author?.id) &&
      runningCommands.get(this.author?.id).getTime() - timestamp.getTime() < 5000
    ) {
      return this.getString("image.slowDown");
    }
    // before awaiting the command result, add this command to the set of running commands
    runningCommands.set(this.author.id, timestamp);

    const staticProps = this.constructor as typeof ImageCommand;

    let imageParams: ImageParams;

    let needsSpoiler = false;
    if (staticProps.requiresImage) {
      try {
        let selection: ImageMeta | undefined;
        if (!this.getOptionAttachment("image") && !this.getOptionString("link")) {
          selection = selectedImages.get(this.author.id);
        }
        const image =
          selection ??
          (await imageDetect(this.client, this.permissions, this.message, this.interaction, true).catch((e) => {
            if (e.name === "AbortError") {
              runningCommands.delete(this.author.id);
              return this.getString("image.timeout");
            }
            throw e;
          }));
        if (image === undefined) {
          runningCommands.delete(this.author.id);
          return `${this.getString(`commands.noImage.${this.cmdName}`, { returnNull: true }) || this.getString("image.noImage", { returnNull: true }) || staticProps.noImage} ${this.getString("image.tip")}`;
        }
        if (typeof image === "string") return image;
        selectedImages.delete(this.author.id);
        needsSpoiler = image.spoiler;
        if (image.type === "large") {
          runningCommands.delete(this.author.id);
          return this.getString("image.large");
        }
        if (image.type === "tenorlimit") {
          runningCommands.delete(this.author.id);
          return this.getString("image.tenor");
        }
        if (image.type === "badurl") {
          runningCommands.delete(this.author.id);
          return this.getString("image.badurl");
        }
        imageParams = {
          cmd: staticProps.command,
          params: {
            togif: !!this.getOptionBoolean("togif"),
          },
          input: {
            type: image.type,
          },
          id: (this.interaction ?? this.message)?.id ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
          path: image.path,
          url: image.url, // technically not required but can be useful for text filtering
          name: image.name,
          onlyAnim: !!staticProps.requiresAnim,
        };
      } catch (e) {
        runningCommands.delete(this.author.id);
        throw e;
      }
    } else {
      imageParams = {
        cmd: staticProps.command,
        params: {
          togif: !!this.getOptionBoolean("togif"),
        },
        id: (this.interaction ?? this.message)?.id ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
      };
    }

    const spoiler = this.getOptionBoolean("spoiler");
    if (spoiler != null) needsSpoiler = spoiler;

    if (staticProps.requiresParam) {
      const text =
        this.getOption(
          staticProps.requiredParam,
          staticProps.requiredParamType,
          staticProps.requiredParamType !== Constants.ApplicationCommandOptionTypes.STRING,
        ) ?? this.args.join(" ").trim();
      if (!text || (typeof text === "string" && isEmpty(text)) || !(await this.criteria(text, imageParams.url))) {
        runningCommands.delete(this.author?.id);
        return (
          this.getString(`commands.noParam.${this.cmdName}`, { returnNull: true }) ||
          this.getString("image.noParam", { returnNull: true }) ||
          staticProps.noParam
        );
      }
    }

    if (this.params) {
      Object.assign(imageParams.params, this.params);
    } else {
      Object.assign(imageParams.params, this.paramsFunc(imageParams.url, imageParams.name));
    }

    let status: Message | undefined;
    if (
      imageParams.input &&
      (imageParams.input.type === "image/gif" || imageParams.input.type === "image/webp") &&
      this.message
    ) {
      status = await this.processMessage(
        this.message.channel ?? (await this.client.rest.channels.get(this.message.channelID)),
      );
    }

    const ephemeral = this.getOptionBoolean("ephemeral");

    if (this.interaction) {
      imageParams.ephemeral = ephemeral;
      imageParams.spoiler = needsSpoiler;
      imageParams.token = this.interaction.token;
    }

    try {
      const result = await runImageJob(imageParams);
      const buffer = result.buffer;
      const type = result.type;
      if (type === "sent") {
        if (buffer.length > 2 && this.interaction && this.interaction.authorizingIntegrationOwners[0] === undefined) {
          const attachment = JSON.parse(buffer.toString()) as RawAttachment & JSONAttachment;
          const path = new URL(attachment.proxy_url ?? attachment.proxyURL);
          path.searchParams.set("animated", "true");
          selectedImages.set(this.interaction.user.id, {
            url: attachment.url,
            path: path.toString(),
            name: attachment.filename,
            type: attachment.content_type ?? attachment.contentType,
            spoiler: attachment.filename.startsWith("SPOILER_"),
          });
        }
        return;
      }
      if (type === "frames") return this.getString("image.frames");
      if (type === "unknown") return this.getString("image.unknown");
      if (type === "noresult") return this.getString("image.noResult");
      if (type === "ratelimit") return this.getString("image.ratelimit");
      if (type === "nocmd") return this.getString("image.nocmd");
      if (type === "noanim" && staticProps.requiresAnim) return this.getString("image.noanim");
      if (type === "empty") return staticProps.empty;
      this.success = true;
      if (type === "text")
        return {
          content: `\`\`\`\n${clean(buffer.toString("utf8"), true)}\n\`\`\``,
          flags: ephemeral ? 64 : undefined,
        };
      return {
        files: [
          {
            contents: buffer,
            name: `${needsSpoiler ? "SPOILER_" : ""}${staticProps.command}.${type}`,
          },
        ],
        flags: ephemeral ? 64 : undefined,
      };
    } catch (e) {
      const err = e as Error;
      if (err.toString().includes("image_not_working")) return this.getString("image.notWorking");
      if (err.toString().includes("Request ended prematurely due to a closed connection"))
        return this.getString("image.tryAgain");
      if (err.toString().includes("image_job_killed") || err.toString().includes("Timeout"))
        return this.getString("image.tooLong");
      if (err.toString().includes("No available servers")) return this.getString("image.noServers");
      throw err;
    } finally {
      try {
        if (status) await status.delete();
      } catch {
        // no-op
      }
      runningCommands.delete(this.author?.id);
    }
  }

  processMessage(channel: AnyTextableChannel): Promise<Message> {
    return channel.createMessage({
      content: `${random(messages.emotes) || "⚙️"} ${this.getString("image.processing")}`,
    });
  }

  static addTextParam() {
    this.flags.unshift({
      name: "text",
      nameLocalizations: getAllLocalizations("image.flagNames.text"),
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to put on the image",
      descriptionLocalizations: getAllLocalizations("image.flags.text"),
      maxLength: 4096,
      required: !this.textOptional,
      classic: true,
    });
  }

  static init() {
    this.flags = [];
    if (this.requiresImage) {
      this.flags.push(
        {
          name: "image",
          nameLocalizations: getAllLocalizations("image.flagNames.image"),
          type: Constants.ApplicationCommandOptionTypes.ATTACHMENT,
          description: "An image/GIF attachment",
          descriptionLocalizations: getAllLocalizations("image.flags.image"),
        },
        {
          name: "link",
          nameLocalizations: getAllLocalizations("image.flagNames.link"),
          type: Constants.ApplicationCommandOptionTypes.STRING,
          description: "An image/GIF URL",
          descriptionLocalizations: getAllLocalizations("image.flags.link"),
        },
      );
    }
    if (!this.alwaysGIF) {
      this.flags.push({
        name: "togif",
        nameLocalizations: getAllLocalizations("image.flagNames.togif"),
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Force GIF output",
        descriptionLocalizations: getAllLocalizations("image.flags.togif"),
      });
    }

    this.flags.push(
      {
        name: "spoiler",
        nameLocalizations: getAllLocalizations("image.flagNames.spoiler"),
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Attempt to send output as a spoiler",
        descriptionLocalizations: getAllLocalizations("image.flags.spoiler"),
      },
      {
        name: "ephemeral",
        nameLocalizations: getAllLocalizations("image.flagNames.ephemeral"),
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Attempt to send output as an ephemeral/temporary response",
        descriptionLocalizations: getAllLocalizations("image.flags.ephemeral"),
      },
    );
    return this;
  }

  static allowedFonts = [
    "futura",
    "impact",
    "helvetica",
    "arial",
    "roboto",
    "noto",
    "times",
    "comic sans ms",
    "ubuntu",
  ];

  static requiresImage = true;
  static requiresParam = false;
  static requiredParam = "text";
  static requiredParamType = Constants.ApplicationCommandOptionTypes.STRING;
  static textOptional = false;
  static requiresAnim = false;
  static alwaysGIF = false;
  static noImage = "You need to provide an image/GIF!";
  static noParam = "You need to provide some text!";
  static empty = "The resulting output was empty!";
  static command = "";
}

export default ImageCommand;
