#include <math.h>

#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Squish(string type, string *outType, char *BufferData,
             size_t BufferLength, [[maybe_unused]] ArgumentMap Arguments,
             size_t *DataSize) {
  VImage in =
      VImage::new_from_buffer(
          BufferData, BufferLength, "",
          type == "gif" ? VImage::option()->set("n", -1)->set("access", "sequential")
                        : 0)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 30;
  double mult = (2 * M_PI) / nPages;

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double newWidth = (sin(i * mult) / 4) + 0.75;
    double newHeight = (cos(i * mult) / 4) + 0.75;
    VImage resized =
        img_frame.resize(newWidth, VImage::option()->set("vscale", newHeight))
            .gravity(VIPS_COMPASS_DIRECTION_CENTRE, width, pageHeight);
    img.push_back(resized);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  if (type != "gif") {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  void *buf;
  final.write_to_buffer(".gif", &buf, DataSize);

  *outType = "gif";

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}