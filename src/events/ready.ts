import process from "node:process";
import { send } from "#utils/handler.js";
import { createPage, generateList } from "#utils/help.js";
import logger from "#utils/logger.js";
import { activityChanger, checkBroadcast } from "#utils/misc.js";
import type { EventParams } from "#utils/types.js";

import commandsConfig from "#config/commands.json" with { type: "json" };
let ready = false;

export default async ({ client, database }: EventParams) => {
  if (ready) return;

  // send slash command data
  if (commandsConfig.types.application && !(process.env.PM2_USAGE && process.env.pm_id !== "1")) {
    try {
      await send(client);
    } catch (e) {
      logger.log("error", e as string);
      logger.log("error", "Failed to send command data to Discord, slash/message commands may be unavailable.");
    }
  }

  // generate docs
  if (process.env.OUTPUT && process.env.OUTPUT !== "") {
    generateList();
    await createPage(process.env.OUTPUT);
    logger.log("info", "The help docs have been generated.");
  }

  await checkBroadcast(client, database);
  activityChanger(client);

  ready = true;

  if (process.env.PM2_USAGE) process.send?.("ready");

  logger.log("info", "Started esmBot.");
};
