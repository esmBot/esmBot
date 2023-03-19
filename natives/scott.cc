#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Scott(string type, string *outType, char *BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t *DataSize) {
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

  string assetPath = basePath + "assets/images/scott.png";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  string distortPath = basePath + "assets/images/scottmap.png";
  VImage distort = VImage::new_from_file(distortPath.c_str());

  VImage distortImage =
      ((distort[1] / 255) * 414).bandjoin((distort[0] / 255) * 233);

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage resized = img_frame.resize(
        415 / (double)width,
        VImage::option()->set("vscale", 234 / (double)pageHeight));
    VImage mapped = resized.mapim(distortImage)
                        .extract_band(0, VImage::option()->set("n", 3))
                        .bandjoin(distort[2]);
    VImage offset = mapped.embed(127, 181, 864, 481);
    VImage composited = bg.composite2(offset, VIPS_BLEND_MODE_OVER);
    img.push_back(composited);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, 481);

  void *buf;
  final.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif" ? VImage::option()->set("dither", 1) : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}