const { EventEmitter } = require("events");
const magick = require("../utils/image.js");

class Job extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.status = "queued";
    this.data = null;
    this.error = null;
  }

  run() {
    this.status = "processing";
    magick.run(this.options, true).then(data => {
      this.status = "success";
      this.data = data;
      return this.emit("data", data, this.options.type);
    }).catch(e => {
      this.status = "error";
      this.error = e;
      return this.emit("error", e);
    });
    return;
  }
}

module.exports = Job;
