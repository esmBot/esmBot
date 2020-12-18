exports.commands = new Map();
exports.aliases = new Map();
exports.info = new Map();

class Cache extends Map {
  constructor(values) {
    super(values);
    this.maxValues = 1024;
  }

  set(key, value) {
    super.set(key, value);
    if (this.size > this.maxValues) this.delete(this.keys().next().value);
  }
}

exports.prefixCache = new Cache();
exports.disabledCache = new Cache();