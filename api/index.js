require("dotenv").config();
const magick = require("../utils/image.js");
const { version } = require("../package.json");
const express = require("express");
const execPromise = require("util").promisify(require("child_process").exec);
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send(`esmBot v${version}`);
});

app.post("/run", express.json(), async (req, res, next) => {
  const object = req.body;
  if (!magick.check(object.cmd)) return res.sendStatus(400);

  try {
    let type;
    if (object.path) {
      type = await magick.getType(object.path);
      if (!type) {
        return res.sendStatus(400);
      }
      object.type = type.split("/")[1];
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }

    const data = await magick.run(object, true);
    res.contentType(type ? type : "png");
    res.send(data);
  } catch (e) {
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Started image API on port ${port}.`);
});