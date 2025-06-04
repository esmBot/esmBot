#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Flip(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 ArgumentMap arguments, bool *shouldKill) {
  bool flop = GetArgumentWithFallback<bool>(arguments, "flop", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true));

  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  VImage out;
  if (flop) {
    out = in.flip(VIPS_DIRECTION_HORIZONTAL);
  } else if (nPages > 1) {
    // libvips animation handling is both a blessing and a curse
    vector<VImage> img;
    int pageHeight = vips_image_get_page_height(in.get_image());
    for (int i = 0; i < nPages; i++) {
      VImage img_frame = in.crop(0, i * pageHeight, in.width(), pageHeight);
      VImage flipped = img_frame.flip(VIPS_DIRECTION_VERTICAL);
      img.push_back(flipped);
    }
    out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  } else {
    out = in.flip(VIPS_DIRECTION_VERTICAL);
  }

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                      outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
