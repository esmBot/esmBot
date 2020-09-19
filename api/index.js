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
  const type = req.file ? (req.file.mimetype === "video/mp4" ? "image/gif" : req.file.mimetype) : "image/png";
  if (!formats.includes(type)) {
    return res.sendStatus(400);
  }
  const object = {
    cmd: req.params.method,
    path: req.file ? req.file.path : null,
    type: type.split("/")[1],
    delay: req.query.delay ? parseInt(req.query.delay) : 0
  };
  for (const param of Object.keys(req.query)) {
    if (param === "delay") continue;
    switch (param) {
      case "sharp":
      case "flop":
      case "loop":
      case "vertical":
      case "first":
      case "stretch":
      case "wide":
      case "soos":
      case "slow":
      case "resize":
      case "append":
      case "mc":
        if (req.query[param] === "true") {
          object[param] = true;
        } else {
          object[param] = false;
        }
        break;
      default:
        object[param] = req.query[param];
        break;
    }
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