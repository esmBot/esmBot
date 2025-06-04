#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Uncaption(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                      ArgumentMap arguments, bool *shouldKill) {
  float tolerance = GetArgumentWithFallback<float>(arguments, "tolerance", 0.5);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  VImage first = in.crop(0, 0, 3, pageHeight).colourspace(VIPS_INTERPRETATION_B_W) > (255 * tolerance);
  int top, captionWidth, captionHeight;
  first.find_trim(&top, &captionWidth, &captionHeight);

  vector<VImage> img;
  int newHeight = pageHeight - top;
  if (top == pageHeight) {
    newHeight = pageHeight;
    top = 0;
  }
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = in.crop(0, (i * pageHeight) + top, width, newHeight);
    img.push_back(img_frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, newHeight);

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
