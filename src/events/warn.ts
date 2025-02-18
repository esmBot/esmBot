import type { Client } from "oceanic.js";
import { warn } from "../utils/logger.js";

export default async (_client: Client, message: string) => {
  warn(message);
};