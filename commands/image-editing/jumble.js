import MediaCommand from "#cmd-classes/mediaCommand.js";

class JumbleCommand extends MediaCommand {
  paramsFunc() {
    const groupsize = this.getOptionInteger("groupsize", true) ?? Number.parseInt(this.args[0]);
    return {
      groupsize: Number.isNaN(groupsize) ? 1 : Math.max(1, Math.min(groupsize, 30)),
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "groupsize",
      type: "integer",
      description: "Set the amount of frames to group together when jumbling (default: 3)",
      minValue: 1,
      maxValue: 30,
      classic: true,
    });
    return this;
  }

  static description = "Jumbles/shuffles an image sequence";

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to jumble!";
  static command = "jumble";
}

export default JumbleCommand;
