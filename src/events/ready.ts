import process from "node:process";
import commandsConfig from "#config/commands.json" with { type: "json" };
import { activityChanger, checkBroadcast } from "#utils/activity.js";
import { send } from "#utils/handler.js";
import { createPage, generateList } from "#utils/help.js";
import logger from "#utils/logger.js";
import { getEnv } from "#utils/runtime.js";
import type { EventParams } from "#utils/types.js";
let ready = false;

let activityInterval: NodeJS.Timeout;

export default async ({ client, database }: EventParams) => {
  if (ready) return;

  // send slash command data
  if (commandsConfig.types.application && !(getEnv("CLUSTER_TYPE") && getEnv("pm_id") !== "1")) {
    try {
      await send(client);
    } catch (e) {
      logger.log("error", e as string);
      logger.log("error", "Failed to send command data to Discord, slash/message commands may be unavailable.");
    }
  }

  // generate docs
  const docsOutput = getEnv("OUTPUT");
  if (docsOutput && docsOutput !== "") {
    generateList();
    await createPage(docsOutput);
    logger.log("info", "The help docs have been generated.");
  }

  await checkBroadcast(client, database);
  activityChanger(client);
  if (!activityInterval) {
    activityInterval = setInterval(() => activityChanger(client), 900000);
  }

  ready = true;

  if (getEnv("CLUSTER_TYPE") === "node") {
    process.send?.({
      data: {
        type: "ready",
      },
    });
  }

  if (getEnv("CLUSTER_TYPE") !== "node") logger.log("info", "Started esmBot.");
};
