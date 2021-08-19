export const commands = new Map();
export const paths = new Map();
export const aliases = new Map();
export const info = new Map();

class TimedMap extends Map {
  set(key, value) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key)) super.delete(key);
    }, 5000);
  }
}

export const runningCommands = new TimedMap();

/*class Cache extends Map {
  constructor(values) {
    super(values);
    this.maxValues = 2048;
  }

  set(key, value) {
    super.set(key, value);
    if (this.size > this.maxValues) this.delete(this.keys().next().value);
  }
}*/

export const prefixCache = new Map();
export const disabledCache = new Map();
export const disabledCmdCache = new Map();