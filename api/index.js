require("dotenv").config();
const magick = require("../utils/image.js");
const Job = require("./job.js");
const { version } = require("../package.json");
const express = require("express");
const execPromise = require("util").promisify(require("child_process").exec);
const app = express();
const port = 3000;

const jobs = new Map();

app.get("/", (req, res) => {
  res.send(`esmBot v${version}`);
});

app.post("/run", express.json(), async (req, res, next) => {
  const object = req.body;
  if (!magick.check(object.cmd)) return res.sendStatus(400);

  try {
    let type;
    if (object.path) {
      type = object.type;
      if (!object.type) {
        type = await magick.getType(object.path);
      }
      if (!type) {
        return res.sendStatus(400);
      }
      object.type = type.split("/")[1];
      if (object.type !== "gif" && object.onlyGIF) return res.send({
        status: "nogif"
      });
      object.delay = object.delay ? object.delay : 0;
    }

    const id = Math.random().toString(36).substring(2, 15);
    if (object.type === "gif" && !object.delay) {
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }
    const job = new Job(object);
    jobs.set(id, job);
    res.send({
      id: id,
      status: "queued"
    });
    job.run();
  } catch (e) {
    next(e);
  }
});

app.get("/status", (req, res) => {
  if (!req.query.id) return res.sendStatus(400);
  const job = jobs.get(req.query.id);
  if (!job) return res.sendStatus(400);
  const timeout = setTimeout(function() {
    job.removeAllListeners();
    return res.send({
      id: req.query.id,
      status: job.status
    });
  }, 10000);
  job.once("data", function() {
    clearTimeout(timeout);
    res.send({
      id: req.query.id,
      status: job.status
    });
    //jobs.delete(req.query.id);
  });
  job.on("error", function(e) {
    clearTimeout(timeout);
    res.status(500);
    res.send({
      id: req.query.id,
      status: job.status,
      error: e
    });
    jobs.delete(req.query.id);
  });
});

app.get("/image", (req, res) => {
  if (!req.query.id) return res.sendStatus(400);
  const job = jobs.get(req.query.id);
  if (!job) return res.sendStatus(400);
  if (!job.data) return res.sendStatus(400);
  if (job.error) return;
  jobs.delete(req.query.id);
  res.contentType(job.options.type ? job.options.type : "png");
  return res.send(job.data);
});

app.listen(port, () => {
  console.log(`Started image API on port ${port}.`);
});
