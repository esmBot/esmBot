import ImageCommand from "../../classes/imageCommand.js";

class AVSCommand extends ImageCommand {
	  params = {
		      water: "./assets/images/avs4you.png",
		      gravity: 5,
		      resize: true
		    };

	  static description = "Adds the avs4you watermark to an image";
	  static aliases = ["avs4you"];

	  static noImage = "You need to provide an image/GIF to add a avs4you watermark!";
	  static command = "watermark";
}

export default AVSCommand;
