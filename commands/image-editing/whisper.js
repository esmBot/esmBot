import ImageCommand from "#cmd-classes/imageCommand.js";

class WhisperCommand extends ImageCommand {
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: this.clean(newArgs)
    };
  }

  static description = "Adds a Whisper style caption to an image";
  static aliases = ["caption4"];

  static requiresText = true;
  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "whisper";
}

export default WhisperCommand;
