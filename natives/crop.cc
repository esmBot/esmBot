#include <map>
#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Crop(string type, string *outType, char *BufferData, size_t BufferLength,
           [[maybe_unused]] ArgumentMap Arguments, size_t *DataSize) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  vector<VImage> img;
  int finalHeight = 0;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    int frameWidth = img_frame.width();
    int frameHeight = img_frame.height();
    bool widthOrHeight = frameWidth / frameHeight >= 1;
    int size = widthOrHeight ? frameHeight : frameWidth;
    // img_frame.crop(frameWidth - size, frameHeight - size, size, size);
    VImage result = img_frame.smartcrop(
        size, size,
        VImage::option()->set("interesting", VIPS_INTERESTING_CENTRE));
    finalHeight = size;
    img.push_back(result);
  }

  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, finalHeight);

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