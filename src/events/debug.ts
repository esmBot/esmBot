import type { Client } from "oceanic.js";
import { debug } from "../utils/logger.js";
import type { DatabasePlugin } from "../database.js";

export default async (_client: Client, _db: DatabasePlugin | undefined, message: string) => {
  debug(message);
};
