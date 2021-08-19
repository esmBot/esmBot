export function log(type, content) { return content ? process.send({ op: type, msg: content }) : process.send({ op: "info", msg: type }); }

export function error(...args) { return log("error", ...args); }

export function warn(...args) { return log("warn", ...args); }

export function debug(...args) { return log("debug", ...args); }
