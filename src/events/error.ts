import type { Client } from "oceanic.js";
import { error } from "../utils/logger.js";
import type { DatabasePlugin } from "../database.js";

export default async (_client: Client, _db: DatabasePlugin | undefined, message: string | Error) => {
  error(message);
};
