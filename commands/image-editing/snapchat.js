import ImageCommand from "../../classes/imageCommand.js";

class SnapchatCommand extends ImageCommand {
  params(url) {
    const newArgs = this.args.filter(item => !item.includes(url));
    const position = parseFloat(this.specialArgs.position);
    return {
      caption: newArgs.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      pos: isNaN(position) ? 0.5 : position
    };
  }

  static description = "Adds a Snapchat style caption to an image";
  static aliases = ["snap", "caption3"];
  static arguments = ["[text]"];
  static flags = [{
    name: "position",
    type: "number",
    description: "Set the position of the caption as a decimal (0.0 is top, 1.0 is bottom)"
  }];

  static requiresText = true;
  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image to add a caption!";
  static command = "snapchat";
}

export default SnapchatCommand;