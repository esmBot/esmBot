#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Resize(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  bool stretch = GetArgumentWithFallback<bool>(arguments, "stretch", false);
  bool wide = GetArgumentWithFallback<bool>(arguments, "wide", false);

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  VImage out;

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  int finalHeight = 0;
  if (stretch) {
    out =
        in.resize(512.0 / (double)width,
                  VImage::option()->set("vscale", 512.0 / (double)pageHeight));
    finalHeight = 512;
  } else if (wide) {
    out = in.resize(9.5, VImage::option()->set("vscale", 0.5));
    finalHeight = pageHeight / 2;
  } else {
    // Pain. Pain. Pain. Pain. Pain.
    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      VImage resized = img_frame.resize(0.1).resize(
          10, VImage::option()->set("kernel", VIPS_KERNEL_NEAREST));
      img.push_back(resized);
      finalHeight = resized.height();
    }
    out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  }
  out.set(VIPS_META_PAGE_HEIGHT, finalHeight);

  char *buf;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
