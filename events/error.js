import { error } from "../utils/logger.js";

export default async (_client, message) => {
  error(message);
};