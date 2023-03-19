#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Flip(string type, string *outType, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
  bool flop = GetArgumentWithFallback<bool>(Arguments, "flop", false);

  VImage in = VImage::new_from_buffer(BufferData, BufferLength, "",
                                      type == "gif"
                                          ? VImage::option()->set("n", -1)->set(
                                                "access", "sequential")
                                          : 0)
                  .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  VImage out;
  if (flop) {
    out = in.flip(VIPS_DIRECTION_HORIZONTAL);
  } else if (type == "gif") {
    // libvips gif handling is both a blessing and a curse
    vector<VImage> img;
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
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

  void *buf;
  out.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif"
          ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
          : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}