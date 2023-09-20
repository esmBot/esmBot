import { activityChanger, checkBroadcast } from "../utils/misc.js";
import { send } from "../utils/handler.js";
import { generateList, createPage } from "../utils/help.js";
import logger from "../utils/logger.js";
import { readFileSync } from "fs";

const { types } = JSON.parse(readFileSync(new URL("../config/commands.json", import.meta.url)));
let ready = false;

export default async (client) => {
  if (ready) return;

  // send slash command data
  if (types.application) {
    try {
      await send(client);
    } catch (e) {
      logger.log("error", e);
      logger.log("error", "Failed to send command data to Discord, slash/message commands may be unavailable.");
    }
  }

  // generate docs
  if (process.env.OUTPUT && process.env.OUTPUT !== "") {
    generateList();
    await createPage(process.env.OUTPUT);
    logger.log("info", "The help docs have been generated.");
  }

  await checkBroadcast(client);
  activityChanger(client);

  ready = true;

  if (process.env.PM2_USAGE) process.send("ready");
  
  logger.log("info", "Started esmBot.");
};