const magick = require("./image.js");
const imagedetect = require("./imagedetect.js");

/**
 * Generate a command that outputs an image through the ImageMagick API.
 * @param {object} args Arguments
 * @param {string} args.commandName The name of this command.
 * @param {string[]} [args.aliases] Aliases of this command.
 * @param {string} args.help This command's help string.
 * @param {boolean} [args.requiresImage=false] True if this command operates on an input image. False by default.
 * @param {boolean} [args.requiresText=false] True if this command requires text to be given. False by default.
 * @param {string} [args.noImageGivenMessage] If `requiresImage` is true, this is the error message that will be
 * displayed to the user if no input image is given.
 * @param {string} [args.noTextGivenMessage] If `requiresText` is true, this is the error message that will be
 * displayed to the user if no input text is given.
 * @param {string} args.magickCommand The name of the ImageMagick command to run.
 * @param {(object|function)} args.params Additional parameters to be passed to the ImageMagick function. This can also
 * be a function which will be called with the command arguments and should return additional parameters as an object.
 */
const makeImageCommand = args => {
  return {
    run: async (message, cmdArgs) => {
      message.channel.sendTyping();
      const magickParams = {
        cmd: args.magickCommand
      };

      if (args.requiresImage) {
        const image = await imagedetect(message);
        if (image === undefined) return `${message.author.mention}, ${args.noImageGivenMessage}`;
        magickParams.path = image.path;
        magickParams.type = image.type;
      }

      if (args.requiresText) {
        if (cmdArgs.length === 0) return `${message.author.mention}, ${args.noTextGivenMessage}`;
      }

      switch (typeof args.params) {
        case "function":
          Object.assign(magickParams, args.makeParams(cmdArgs));
          break;
        case "object":
          Object.assign(magickParams, args.params);
          break;
      }

      const { buffer, type } = await magick.run(magickParams);
      return {
        file: buffer,
        name: `${args.commandName}.${type}`
      };
    },
    aliases: args.aliases,
    category: 5,
    help: args.help
  };
};

module.exports = makeImageCommand;
