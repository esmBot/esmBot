import ImageCommand from "#cmd-classes/imageCommand.js";

class SpotifyCommand extends ImageCommand {
  params(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: this.clean(newArgs),
    };
  }

  static description = "Adds a Spotify \"This is\" header to an image";

  static requiresText = true;
  static noText = "You need to provide some text to add a Spotify \"This is\" header!";
  static noImage = "You need to provide an image/GIF to add a Spotify \"This is\" header!";
  static command = "spotify";
}

export default SpotifyCommand;
