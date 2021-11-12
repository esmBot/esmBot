export function log(type, content) { return content ? console[type](content) : console.info(type); }

export function error(...args) { return log("error", ...args); }

export function warn(...args) { return log("warn", ...args); }

export function debug(...args) { return log("debug", ...args); }
