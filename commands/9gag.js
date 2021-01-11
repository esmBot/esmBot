const makeImageCommand = require("../utils/image-command.js");

module.exports = makeImageCommand({
  commandName: "9gag",
  aliases: ["ninegag", "gag"],
  help: "Adds the 9gag watermark to an image",
  requiresImage: true,
  noImageGivenMessage: "you need to provide an image to add a 9GAG watermark!",
  magickCommand: "watermark",
  params: {
    water: "./assets/images/9gag.png",
    gravity: 6
  }
});
