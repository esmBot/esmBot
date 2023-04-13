#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Tile(string type, string *outType, char *BufferData,
                 size_t BufferLength, [[maybe_unused]] ArgumentMap Arguments,
                 size_t *DataSize) {
  VOption *options = VImage::option();

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  vector<VImage> img;
  int finalHeight;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage replicated = img_frame.replicate(5, 5);
    double scale = 800.0 / replicated.height();
    if (scale > 1) scale = 800.0 / replicated.width();
    if (scale < 1) replicated = replicated.resize(scale);
    finalHeight = replicated.height();
    img.push_back(replicated);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, finalHeight);

  void *buf;
  final.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif" ? VImage::option()->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}