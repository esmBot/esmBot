#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Reverse([[maybe_unused]] const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                    ArgumentMap arguments, bool *shouldKill) {
  bool soos = GetArgumentWithFallback<bool>(arguments, "soos", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, false, false));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      ArgumentMap output;
      output["buf"] = "";
      outType = "frames";
      return output;
    }
  }

  // this command is useless with single-page images
  if (nPages < 2) {
    size_t dataSize = bufferLength;
    char *data = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);

    ArgumentMap output;
    output["buf"] = data;
    output["size"] = dataSize;

    return output;
  }

  vector<VImage> out;
  vector<int> delaysOut;
  int *delays;
  in.get_array_int("delay", &delays, NULL);
  if (soos) {
    for (int i = 0; i < nPages; i++) {
      VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
      out.push_back(img_frame);
      delaysOut.push_back(delays[i]);
    }

    for (int i = nPages - 2; i > 0; i--) {
      VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
      out.push_back(img_frame);
      delaysOut.push_back(delays[i]);
    }
  } else {
    for (int i = nPages - 1; i > -1; i--) {
      VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
      out.push_back(img_frame);
      delaysOut.push_back(delays[i]);
    }
  }

  VImage final = VImage::arrayjoin(out, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  final.set("delay", delaysOut);

  if (outType != "webp") outType = "gif";

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0) : 0);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
