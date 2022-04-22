import * as Minio from "minio";

const client = new Minio.Client({
    endPoint: process.env.S3_ENDPOINT,
    useSSL: !(process.env.S3_NO_SSL == "true"),
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
});

const bucket = process.env.S3_BUCKET;

export async function upload(mid, result) {
    const filename = mid + "." + result.name.split(".")[1];
    await client.putObject(bucket, filename, result.file);
    const imageURL = `${process.env.TMP_DOMAIN}/${filename}`;
    return imageURL;
}