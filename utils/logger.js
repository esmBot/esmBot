const moment = require("moment");
const winston = require("winston");
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/main.log" }),
  ],
  format: winston.format.printf(log => `[${moment().format("YYYY-MM-DD HH:mm:ss")}]: [${log.level.toUpperCase()}] - ${log.message}`)
});

exports.log = (type, content) => content ? logger.log(type, content) : logger.log("info", type);

exports.error = (...args) => this.log("error", ...args);

exports.warn = (...args) => this.log("warn", ...args);

exports.debug = (...args) => this.log("debug", ...args);
