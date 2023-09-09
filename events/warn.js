import { warn } from "../utils/logger.js";

export default async (_client, message) => {
  warn(message);
};