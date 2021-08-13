exports.commands = new Map();
exports.paths = new Map();
exports.aliases = new Map();
exports.info = new Map();

class TimedMap extends Map {
  set(key, value) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key)) super.delete(key);
    }, 5000);
  }
}

exports.runningCommands = new TimedMap();

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

exports.prefixCache = new Map();
exports.disabledCache = new Map();
exports.disabledCmdCache = new Map();