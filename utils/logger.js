exports.log = (type, content) => content ? process.send({ name: type, msg: content }) : process.send({ name: "info", msg: type });

exports.error = (...args) => this.log("error", ...args);

exports.warn = (...args) => this.log("warn", ...args);

exports.debug = (...args) => this.log("debug", ...args);
