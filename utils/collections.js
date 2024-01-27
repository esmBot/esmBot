export const commands = new Map();
export const messageCommands = new Map();
export const paths = new Map();
export const aliases = new Map();
export const info = new Map();
export const categories = new Map();

class TimedMap extends Map {
  constructor(time, values) {
    super(values);
    this.time = time;
  }
  set(key, value) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key)) super.delete(key);
    }, this.time);
    return this;
  }
}

export const runningCommands = new TimedMap(5000);
export const selectedImages = new TimedMap(180000);

class Cache extends Map {
  constructor(values) {
    super(values);
    this.maxValues = 2048;
  }

  set(key, value) {
    super.set(key, value);
    if (this.size > this.maxValues) this.delete(this.keys().next().value);
    return this;
  }
}

export const prefixCache = new Cache();
export const disabledCache = new Cache();
export const disabledCmdCache = new Cache();