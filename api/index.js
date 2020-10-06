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

function isValidJSON(json) {
  try {
    JSON.parse(json);
  } catch (e) {
    return false;
  }
  return true;
}

app.get("/", (req, res) => {
  res.send(`esmBot v${version}`);
});

app.post("/run", upload.single("image"), async (req, res, next) => {
  const type = req.file ? (req.file.mimetype === "video/mp4" ? "image/gif" : req.file.mimetype) : "image/png";
  if (!formats.includes(type)) {
    return res.sendStatus(400);
  }
  if (!isValidJSON(req.body.data)) return res.sendStatus(400);

  const object = JSON.parse(req.body.data);

  if (!magick.check(object.cmd)) return res.sendStatus(400);

  object.path = req.file ? req.file.path : null;
  object.type = type.split("/")[1];

  try {
    const data = await magick.run(object, true);
    res.contentType(type);
    res.send(data);
  } catch (e) {
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Started image API on port ${port}.`);
});