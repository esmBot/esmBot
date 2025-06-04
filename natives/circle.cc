#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

VImage polarMap(int width, int height) {
  VImage xy = VImage::xyz(width, height);
  xy -= {width / 2.0, height / 2.0};
  int scale = max(width, height) / width;
  xy *= 1.5 / scale;
  VImage indexComplex = xy.copy(VImage::option()->set("format", VIPS_FORMAT_COMPLEX)->set("bands", 1)).polar();

  VImage index = indexComplex.copy(VImage::option()->set("format", VIPS_FORMAT_FLOAT)->set("bands", 2));
  index *= {1, height / 360.0};
  return index;
}

VImage rectangularMap(int width, int height) {
  VImage xy = VImage::xyz(width, height);
  xy *= vector<double>{1, 360.0 / height};
  VImage indexComplex = xy.copy(VImage::option()->set("format", VIPS_FORMAT_COMPLEX)->set("bands", 1)).rect();

  VImage index = indexComplex.copy(VImage::option()->set("format", VIPS_FORMAT_FLOAT)->set("bands", 2));
  double scale = static_cast<double>(max(width, height)) / width / 1.5;
  index *= scale;
  index += {width / 2.0, height / 2.0};
  return index;
}

ArgumentMap Circle(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                   [[maybe_unused]] ArgumentMap arguments, bool *shouldKill) {

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, false, false));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      ArgumentMap output;
      output["buf"] = "";
      outType = "frames";
      return output;
    }
  }

  VImage rectIndex = rectangularMap(width, pageHeight);
  VImage polarIndex = polarMap(width, pageHeight);
  VImage gaussmat = VImage::gaussmat(5, 0.2, VImage::option()->set("separable", true)).rot90();

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage result = img_frame.mapim(rectIndex)
                      .replicate(1, 3)
                      .conv(gaussmat, VImage::option()->set("precision", VIPS_PRECISION_INTEGER))
                      .crop(0, pageHeight, width, pageHeight)
                      .mapim(polarIndex, VImage::option()->set("extend", VIPS_EXTEND_MIRROR));
    img.push_back(result);
  }

  VImage out = VImage::arrayjoin(img, VImage::option()->set("across", 1));

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                      outType == "gif" ? VImage::option()->set("dither", 0) : 0);
  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;
  return output;
}
