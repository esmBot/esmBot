const { BaseServiceWorker } = require("eris-fleet");
const http = require("http");
const logger = require("../logger.js");
const database = require("../database.js");

class PrometheusWorker extends BaseServiceWorker {
  constructor(setup) {
    super(setup);

    if (process.env.METRICS !== "" && process.env.METRICS !== undefined) {
      this.httpServer = http.createServer(async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          return res.end("GET only");
        }
        res.write(`# HELP command_count Number of times a command has been run
# TYPE command_count counter
`);
        if (process.env.API === "true") {
          const servers = await this.ipc.command("image", { type: "stats" }, true);
          res.write(`# HELP connected_workers Number of workers connected
# TYPE connected_workers gauge
connected_workers ${servers.length}
# HELP running_jobs Number of running jobs on this worker
# TYPE running_jobs gauge
# HELP queued_jobs Number of queued jobs on this worker
# TYPE queued_jobs gauge
# HELP max_jobs Number of max allowed jobs on this worker
# TYPE max_jobs gauge
`);
          for (const [i, w] of servers.entries()) {
            res.write(`running_jobs{worker="${i}"} ${w.runningJobs}\n`);
            res.write(`queued_jobs{worker="${i}"} ${w.queued}\n`);
            res.write(`max_jobs{worker="${i}"} ${w.max}\n`);
          }
        }
        const counts = await database.getCounts();
        for (const [i, w] of Object.entries(counts)) {
          res.write(`command_count{command="${i}"} ${w}\n`);
        }
        res.end();
      });
      this.httpServer.listen(process.env.METRICS, () => {
        logger.log("info", `Serving metrics at ${process.env.METRICS}`);
      });
    }

    this.serviceReady();
  }

  shutdown(done) {
    this.httpServer.close();
    done();
  }
}

module.exports = PrometheusWorker;
