import Command from "#cmd-classes/command.js";

const images = [
  "caption_107.gif", "caption_110.gif", "caption_114.gif", "caption_126.gif",
  "caption_143.gif", "caption_148.gif", "caption_153.gif", "caption_160.gif",
  "caption_165.gif", "caption_167.gif", "caption_170.gif", "caption_174.gif",
  "caption_182.gif", "caption_184.gif", "caption_185.gif", "caption_191.gif",
  "caption_193.gif", "caption_195.gif", "caption_197.gif", "caption_204.gif",
  "caption_217.gif", "caption_219.gif", "caption_222.gif", "caption_229.gif",
  "caption_238.gif", "caption_239.gif", "caption_247.gif", "caption_251.gif",
  "caption_252.gif", "caption_253.gif", "caption_255.gif", "caption_257.gif",
  "caption_261.gif", "caption_275.gif", "caption_296.gif", "caption_300.gif",
  "caption_302.gif", "caption_303.gif", "caption_305.gif", "caption_314.gif",
  "caption_322.gif", "caption_328.gif", "caption_330.gif", "caption_331.gif",
  "caption_332.gif", "caption_333.gif", "caption_334.gif", "caption_340.gif",
  "caption_342.gif", "caption_347.gif", "caption_355.gif", "caption_362.gif",
  "caption_364.gif", "caption_366.gif", "caption_396.gif", "caption_404.gif",
  "caption_411.gif", "caption_416.gif", "caption_418.gif", "caption_419.gif",
  "caption_440.gif", "caption_450.gif", "caption_463.gif", "caption_465.gif",
  "caption_467.gif", "caption_470.gif", "caption_474.gif", "caption_480.gif",
  "caption_484.gif", "caption_489.gif", "caption_490.gif", "caption_520.gif",
  "caption_524.gif", "caption_531.gif", "caption_532.gif", "caption_534.gif",
  "caption_536.gif", "caption_541.gif", "caption_545.gif", "caption_561.gif",
  "caption_564.gif", "caption_571.gif", "caption_574.gif", "caption_582.gif",
  "caption_586.gif", "caption_594.gif", "caption_603.gif", "caption_604.gif",
  "caption_605.gif", "caption_606.gif", "caption_607.gif", "caption_612.gif",
  "caption_615.gif", "caption_621.gif", "caption_628.gif", "caption_65.gif",
  "caption_7.gif", "caption_74.gif", "caption_78.gif", "caption_82.gif",
  "caption_86.gif", "caption_93.gif", "togif_22.gif",
];

class SkuubCommand extends Command {
  async run() {
    const img = images[Math.floor(Math.random() * images.length)];
    return `https://r2.fivemanage.com/LTm3ynKIgbqebX4GGCrxi/${img}`;
  }

  static description = "Posts a random skuub gif";
}

export default SkuubCommand;
