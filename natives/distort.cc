#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Distort(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                    ArgumentMap arguments, bool *shouldKill) {
  string mapName = GetArgument<string>(arguments, "mapName");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  string distortPath = basePath + "assets/images/" + mapName;
  VImage distort =
    (VImage::new_from_file(distortPath.c_str())
       .resize(width / 500.0, VImage::option()->set("vscale", pageHeight / 500.0)->set("kernel", VIPS_KERNEL_CUBIC)) /
     65535);

  VImage distortImage = (distort[0] * width).bandjoin(distort[1] * pageHeight);

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage mapped = img_frame.mapim(distortImage);
    img.push_back(mapped);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
