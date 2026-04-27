import MediaCommand from "#cmd-classes/mediaCommand.js";

class SpotifyCommand extends MediaCommand {
  paramsFunc() {
    const newArgs = this.getOptionString("text") ?? this.args.join(" ");
    return {
      caption: this.clean(newArgs),
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    return this;
  }

  static description = 'Adds a Spotify "This is" header to an image';

  static requiresParam = true;
  static noParam = 'You need to provide some text to add a Spotify "This is" header!';
  static noImage = 'You need to provide an image/GIF to add a Spotify "This is" header!';
  static command = "spotify";
}

export default SpotifyCommand;
