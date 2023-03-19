#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Zamn(string type, string *outType, char *BufferData, size_t BufferLength,
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

  string assetPath = basePath + "assets/images/zamn.png";
  VImage tmpl = VImage::new_from_file(assetPath.c_str());

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage composited = tmpl.insert(
        img_frame.extract_band(0, VImage::option()->set("n", 3))
            .bandjoin(255)
            .resize(
                303.0 / (double)width,
                VImage::option()->set("vscale", 438.0 / (double)pageHeight)),
        310, 76);
    img.push_back(composited);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, 516);

  void *buf;
  final.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}