import { config } from "dotenv";
config();

let uploader = null;

if (process.env.UPLOADER) {
    uploader = await import(`./uploaders/${process.env.UPLOADER}.js`);
} else if (process.env.TEMPDIR) {
    uploader = await import("./uploaders/tempdir.js");
}

export default uploader;
