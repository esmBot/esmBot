import type InteractionCollector from "../pagination/awaitinteractions.ts";
import type { ImageMeta } from "./imagedetect.ts";
import type { CommandEntry, CommandInfo } from "./types.ts";

export const commands = new Map<string, CommandEntry>();
export const messageCommands = new Map<string, CommandEntry>();
export const userCommands = new Map<string, CommandEntry>();

export const paths = new Map<string, string>();
export const aliases = new Map<string, string>();
export const info = new Map<string, CommandInfo>();
export const categories = new Map<string, Set<string>>();

export const collectors = new Map<string, InteractionCollector>();

export const locales = new Map();

class TimedMap<K, V> extends Map {
  time: number;
  constructor(time: number) {
    super();
    this.time = time;
  }
  set(key: K, value: V) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key)) super.delete(key);
    }, this.time);
    return this;
  }
}

export const runningCommands = new TimedMap<string, Date>(5000);
export const selectedImages = new TimedMap<string, ImageMeta>(180000);

class Cache<K, V> extends Map {
  maxValues: number;
  constructor() {
    super();
    this.maxValues = 2048;
  }

  set(key: K, value: V) {
    super.set(key, value);
    if (this.size > this.maxValues) this.delete(this.keys().next().value);
    return this;
  }
}

export const prefixCache = new Cache<string, string>();
export const disabledCache = new Cache<string, string[]>();
export const disabledCmdCache = new Cache<string, string[]>();
