#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Resize(string type, string *outType, char *BufferData,
             size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  bool stretch = GetArgumentWithFallback<bool>(Arguments, "stretch", false);
  bool wide = GetArgumentWithFallback<bool>(Arguments, "wide", false);

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  VImage out;

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  int finalHeight;
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

  void *buf;
  out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}