import type { Client } from "oceanic.js";
import { error } from "../utils/logger.js";

export default async (_client: Client, message: string | Error) => {
  error(message);
};
