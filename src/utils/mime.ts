export function mimeToExt(mime: string) {
  switch (mime) {
    case "image/gif":
      return "gif";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return mime.split("/")[1] ?? "unknown";
  }
}
