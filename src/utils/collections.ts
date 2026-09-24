import type InteractionCollector from "../pagination/awaitinteractions.ts";
import type { ExtCommand, MediaMeta } from "./types.ts";

export const commands = new Map<string, ExtCommand>();
export const messageCommands = new Map<string, ExtCommand>();
export const userCommands = new Map<string, ExtCommand>();

export const paths = new Map<string, string>();
export const aliases = new Map<string, string>();
export const categories = new Map<string, Set<string>>();

export const collectors = new Map<string, InteractionCollector>();

export const locales = new Map();

class TimedMap<K, V> extends Map<K, V> {
  time: number;
  private timeouts: Map<K, ReturnType<typeof setTimeout>> = new Map();

  constructor(time: number) {
    super();
    this.time = time;
  }

  set(key: K, value: V) {
    super.set(key, value);
    const oldHandle = this.timeouts.get(key);
    if (oldHandle) clearTimeout(oldHandle);

    const handle = setTimeout(() => {
      this.delete(key);
    }, this.time);
    this.timeouts.set(key, handle);
    return this;
  }

  delete(key: K) {
    const out = super.delete(key);
    const handle = this.timeouts.get(key);
    if (handle) {
      clearTimeout(handle);
      this.timeouts.delete(key);
    }
    return out;
  }
}

export const runningCommands = new TimedMap<string, Date>(5000);
export const selectedImages = new TimedMap<string, MediaMeta>(180000);
