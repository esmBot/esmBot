import { setTimeout } from "node:timers/promises";
import Command from "#cmd-classes/command.js";

const RADAR_GIF = "https://media.tenor.com/97tbVj0gmiAAAAAC/radar-scan.gif";
const SCAN_TIME_MS = 3500;

class SkuubDetectorCommand extends Command {
  async run() {
    if (this.type === "application" && this.interaction) {
      await this.interaction.createFollowup({
        content: `Scanning server for skuubs...\n${RADAR_GIF}`,
      });
    } else {
      await this.acknowledge();
      if ("createMessage" in this.channel) {
        await this.channel.createMessage(`Scanning server for skuubs...\n${RADAR_GIF}`);
      }
    }

    await setTimeout(SCAN_TIME_MS);
    return "Skuubs detected in this server: **1**";
  }

  static description = "Detects how many skuubs are in the server";
}

export default SkuubDetectorCommand;
