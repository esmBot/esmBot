import { setTimeout } from "node:timers/promises";
import Command from "#cmd-classes/command.js";

const RADAR_GIF = "https://media1.tenor.com/m/8Juj0k-1L4AAAAAd/radar-love-search.gif";
const SCAN_TIME_MS = 3500;
const SCANNING_MESSAGE = {
  content: "Scanning server for skuubs...",
  embeds: [
    {
      image: {
        url: RADAR_GIF,
      },
    },
  ],
};

class SkuubDetectorCommand extends Command {
  async run() {
    if (this.type === "application" && this.interaction) {
      await this.interaction.createFollowup(SCANNING_MESSAGE);
    } else {
      await this.acknowledge();
      if ("createMessage" in this.channel) {
        await this.channel.createMessage(SCANNING_MESSAGE);
      }
    }

    await setTimeout(SCAN_TIME_MS);
    return "Skuubs detected in this server: **1**";
  }

  static description = "Detects how many skuubs are in the server";
}

export default SkuubDetectorCommand;
