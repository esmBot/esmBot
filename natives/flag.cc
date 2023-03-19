#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Flag(string type, string *outType, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
  string overlay = GetArgument<string>(Arguments, "overlay");
  string basePath = GetArgument<string>(Arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  string assetPath = basePath + overlay;
  VImage overlayInput = VImage::new_from_file(assetPath.c_str());
  VImage overlayImage = overlayInput.resize(
      (double)width / (double)overlayInput.width(),
      VImage::option()->set(
          "vscale", (double)pageHeight / (double)overlayInput.height()));
  if (!overlayImage.has_alpha()) {
    overlayImage = overlayImage.bandjoin(127);
  } else {
    // this is a pretty cool line, just saying
    overlayImage = overlayImage * vector<double>{1, 1, 1, 0.5};
  }
  VImage replicated = overlayImage.replicate(1, nPages);
  VImage final = in.composite2(replicated, VIPS_BLEND_MODE_OVER);

  void *buf;
  final.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif"
          ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
          : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}