require("dotenv").config();
const magick = require("../utils/image.js");
const { version } = require("../package.json");
const express = require("express");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "/tmp/");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const app = express();
const port = 3000;

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

app.get("/", (req, res) => {
  res.send(`esmBot v${version}`);
});

app.post("/:method", upload.single("image"), async (req, res, next) => {
  const type = req.file.mimetype === "video/mp4" ? "image/gif" : req.file.mimetype;
  if (!formats.includes(type)) {
    return res.sendStatus(400);
  }
  const object = {
    cmd: req.params.method,
    path: req.file.path,
    type: type.split("/")[1],
    delay: parseInt(req.params.delay)
  };
  for (const param of Object.keys(req.query)) {
    if (param === "delay") continue;
    object[param] = req.query[param];
  }

  try {
    const data = await magick(object, true);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Started image API on port ${port}.`);
});