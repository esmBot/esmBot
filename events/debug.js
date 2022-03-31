import { debug } from "../utils/logger.js";

export default async (client, cluster, worker, ipc, message) => {
  debug(message);
};