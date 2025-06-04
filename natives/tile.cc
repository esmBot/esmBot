#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Tile(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 [[maybe_unused]] ArgumentMap arguments, bool *shouldKill) {
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

  vector<VImage> img;
  int finalHeight = 0;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage replicated = img_frame.replicate(5, 5);
    double scale = 800.0 / replicated.height();
    if (scale > 1) scale = 800.0 / replicated.width();
    if (scale < 1) replicated = replicated.resize(scale);
    finalHeight = replicated.height();
    img.push_back(replicated);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, finalHeight);

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
