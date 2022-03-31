import ImageCommand from "../../classes/imageCommand.js";

class SnapchatCommand extends ImageCommand {
  constructor(client, cluster, worker, ipc, options) {
    super(client, cluster, worker, ipc, options);
    this.flags.push({
      name: "position",
      type: 10,
      description: "Set the position of the caption as a decimal (0.0 is top, 1.0 is bottom, default is 0.5)",
      min_value: 0,
      max_value: 1
    });
  }

  params(url) {
    const newArgs = this.type === "classic" ? this.args.filter(item => !item.includes(url)).join(" ") : this.options.text;
    const position = parseFloat(this.specialArgs.position);
    return {
      caption: newArgs.replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      pos: isNaN(position) ? 0.5 : position
    };
  }

  static description = "Adds a Snapchat style caption to an image";
  static aliases = ["snap", "caption3"];
  static arguments = ["[text]"];

  static requiresText = true;
  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "snapchat";
}

export default SnapchatCommand;
