import ImageCommand from "../../classes/imageCommand.js";

class SlowCommand extends ImageCommand {
  constructor(client, cluster, worker, ipc, options) {
    super(client, cluster, worker, ipc, options);
    this.flags.push({
      name: "multiplier",
      type: 4,
      description: "Set the speed multiplier (default: 2)",
      min_value: 1
    });
  }

  params() {
    const speed = parseInt(this.type === "classic" ? this.args[0] : this.options.multiplier);
    return {
      slow: true,
      speed: isNaN(speed) ? 2 : speed
    };
  }

  static description = "Makes an image sequence slower";
  static aliases = ["slowdown", "slower", "gifspeed2"];
  static arguments = ["{multiplier}"];

  static requiresGIF = true;
  static noImage = "You need to provide an image/GIF to slow down!";
  static command = "speed";
}

export default SlowCommand;
