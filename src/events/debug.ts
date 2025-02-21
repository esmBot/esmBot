import type { Client } from "oceanic.js";
import { debug } from "../utils/logger.js";

export default async (_client: Client, message: string) => {
  debug(message);
};
