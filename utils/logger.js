exports.log = (type, content) => content ? process.send({ op: type, msg: content }) : process.send({ op: "info", msg: type });

exports.error = (...args) => this.log("error", ...args);

exports.warn = (...args) => this.log("warn", ...args);

exports.debug = (...args) => this.log("debug", ...args);
