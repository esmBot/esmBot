#include <math.h>

#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Fade(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 ArgumentMap arguments, bool *shouldKill) {
  bool alpha = GetArgumentWithFallback<bool>(arguments, "alpha", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true))
                .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  bool multiPage = true;

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

  if (nPages == 1) {
    multiPage = false;
    nPages = 30;
  }

  if (alpha) outType = "webp";
  if (outType != "webp") outType = "gif";

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double mult = (double)i / (nPages - 1);
    VImage faded = img_frame.extract_band(0, VImage::option()->set("n", img_frame.bands() - 1));
    if (outType == "gif") {
      faded *= mult;
    } else {
      faded = faded.bandjoin(img_frame.extract_band(img_frame.bands() - 1) * mult);
    }
    img.push_back(faded);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  if (!multiPage) {
    vector<int> delay(30, 50);
    final.set("delay", delay);
    final.set("loop", 1);
  }

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
