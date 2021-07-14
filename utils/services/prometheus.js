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
        res.write(`# HELP esmbot_command_count Number of times a command has been run
# TYPE esmbot_command_count counter
`);
        if (process.env.API === "true") {
          const servers = await this.ipc.command("image", { type: "stats" }, true);
          res.write(`# HELP esmbot_connected_workers Number of workers connected
# TYPE esmbot_connected_workers gauge
esmbot_connected_workers ${servers.length}
# HELP esmbot_running_jobs Number of running jobs on this worker
# TYPE esmbot_running_jobs gauge
# HELP esmbot_queued_jobs Number of queued jobs on this worker
# TYPE esmbot_queued_jobs gauge
# HELP esmbot_max_jobs Number of max allowed jobs on this worker
# TYPE esmbot_max_jobs gauge
`);
          for (const [i, w] of servers.entries()) {
            res.write(`esmbot_running_jobs{worker="${i}"} ${w.runningJobs}\n`);
            res.write(`esmbot_queued_jobs{worker="${i}"} ${w.queued}\n`);
            res.write(`esmbot_max_jobs{worker="${i}"} ${w.max}\n`);
          }
        }
        const counts = await database.getCounts();
        for (const [i, w] of Object.entries(counts)) {
          res.write(`esmbot_command_count{command="${i}"} ${w}\n`);
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
