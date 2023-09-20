#include <math.h>

#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Bounce(string type, string *outType, char *BufferData,
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
  int nPages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 15;
  double mult = M_PI / nPages;
  int halfHeight = pageHeight / 2;

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double height = halfHeight * ((abs(sin(i * mult)) * -1) + 1);
    VImage embedded =
        img_frame.embed(0, height, width, pageHeight + halfHeight);
    img.push_back(embedded);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + halfHeight);
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