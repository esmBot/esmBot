import { error } from "#utils/logger.js";
import type { EventParams } from "#utils/types.js";

export default (_: EventParams, message: string | Error) => {
  error(message);
};
