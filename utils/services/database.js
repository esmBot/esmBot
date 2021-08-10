// service wrapper for the database drivers in ../database/
const { BaseServiceWorker } = require("eris-fleet");

const database = require(`../database/${process.env.DB ? process.env.DB.split("://")[0] : "dummy"}.js`);

class DatabaseWorker extends BaseServiceWorker {
  constructor(setup) {
    super(setup);
    this.serviceReady();
  }

  async handleCommand(data) {
    try {
      if (database[data.name]) {
        return await database[data.name](...data.args);
      } else {
        throw "Unknown query";
      }
    } catch (err) {
      return { err: typeof err === "string" ? err : err.message };
    }
  }

  shutdown(done) {
    database.stop().then(() => done);
  }
}

module.exports = DatabaseWorker;
