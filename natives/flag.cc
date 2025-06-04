#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Flag(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 ArgumentMap arguments, bool *shouldKill) {
  string overlay = GetArgument<string>(arguments, "overlay");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  string assetPath = basePath + overlay;
  VImage overlayInput = VImage::new_from_file(assetPath.c_str());
  VImage overlayImage =
    overlayInput.resize((double)width / (double)overlayInput.width(),
                        VImage::option()->set("vscale", (double)pageHeight / (double)overlayInput.height()));
  if (!overlayImage.has_alpha()) {
    overlayImage = overlayImage.bandjoin(127);
  } else {
    // this is a pretty cool line, just saying
    overlayImage = overlayImage * vector<double>{1, 1, 1, 0.5};
  }
  VImage replicated = overlayImage.replicate(1, nPages);
  VImage final = in.composite2(replicated, VIPS_BLEND_MODE_OVER);

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
