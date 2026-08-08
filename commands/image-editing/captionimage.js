import MediaCommand from "#cmd-classes/mediaCommand.js";

class CaptionImageCommand extends MediaCommand {
  async run() {
    this.success = false;

    const attachment = this.getCaptionAttachment();
    if (!attachment) return this.getString("image.captionImageRequired");
    if (attachment.contentType && !attachment.contentType.startsWith("image/"))
      return this.getString("image.captionImageInvalid");

    return super.run();
  }

  paramsFunc() {
    const attachment = this.getCaptionAttachment();
    return {
      captionImageUrl: attachment ? (attachment.proxyURL ?? attachment.url) : undefined,
    };
  }

  getCaptionAttachment() {
    return this.interaction?.data.options.getAttachment("capimage") ?? this.message?.attachments.first();
  }

  static init() {
    super.init();
    this.flags.unshift({
      name: "capimage",
      type: "attachment",
      description: "The image to put on top of the selected image",
      required: true,
    });
    return this;
  }

  static description = "Captions an image with another image";
  static aliases = ["imagecaption", "imgcaption", "capimg"];

  static attachmentAlwaysAuxiliary = true;
  static noImage = "You need to provide an image/GIF to caption!";
  static command = "captionImage";
}

export default CaptionImageCommand;
