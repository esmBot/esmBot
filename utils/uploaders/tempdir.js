import { promises } from "fs";

export async function upload(mid, result) {
    const filename = mid + "." + result.name.split(".")[1];
    await promises.writeFile(`${process.env.TEMPDIR}/${filename}`, result.file);
    const imageURL = `${process.env.TMP_DOMAIN || "https://tmp.projectlounge.pw"}/${filename}`;
    if (process.env.THRESHOLD) {
      process.env.DIRSIZECACHE += result.file.length;
      if (process.env.DIRSIZECACHE > process.env.THRESHOLD) {
        const files = (await promises.readdir(process.env.TEMPDIR)).map((file) => {
          return new Promise((resolve, reject) => {
            promises.stat(`${process.env.TEMPDIR}/${file}`).then((fstats)=>{
              resolve({
                name: file,
                size: fstats.size,
                ctime: fstats.ctime
              });
            }).catch(reject);
          });
        });
        Promise.all(files).then((files) => {
          process.env.DIRSIZECACHE = files.reduce((a, b)=>{
            return a+b.size;
          }, 0);
          const oldestFile = files.sort((a, b) => a.ctime - b.ctime)[0].name;
          promises.rm(`${process.env.TEMPDIR}/${oldestFile}`);
          log(`Removed oldest image file: ${oldestFile}`);
        });
      }
    }
    return imageURL;
}