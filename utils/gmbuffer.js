// workaround for a gm bug where it doesn't output buffers properly
// https://github.com/aheckmann/gm/issues/572#issuecomment-293768810
module.exports = (data, format) => {
  return new Promise((resolve, reject) => {
    if (format) {
      data.out("-layers", "optimize").stream(format, (err, stdout, stderr) => {
        if (err) return reject(err);
        const chunks = [];
        stdout.on("data", (chunk) => {
          chunks.push(chunk);
        });
        // these are 'once' because they can and do fire multiple times for multiple errors,
        // but this is a promise so you'll have to deal with them one at a time
        stdout.once("end", () => {
          resolve(Buffer.concat(chunks));
        });
        stderr.once("data", (data) => {
          reject(data.toString());
        });
      });
    } else {
      data.out("-layers", "optimize").stream((err, stdout, stderr) => {
        if (err) return reject(err);
        const chunks = [];
        stdout.on("data", (chunk) => {
          chunks.push(chunk);
        });
        // these are 'once' because they can and do fire multiple times for multiple errors,
        // but this is a promise so you'll have to deal with them one at a time
        stdout.once("end", () => {
          resolve(Buffer.concat(chunks));
        });
        stderr.once("data", (data) => {
          reject(data.toString());
        });
      });
    }
  });
};
