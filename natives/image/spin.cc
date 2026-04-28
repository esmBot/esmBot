#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::SpinArgs = {
  {"angle", {typeid(int), false}}
};

CmdOutput esmb::Image::Spin(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                            [[maybe_unused]] esmb::ArgumentMap arguments, bool *shouldKill) {
  int staticAngle = GetArgumentWithFallback<int>(arguments, "angle", 0);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true))
                .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  bool multiPage = true;

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      outType = "frames";
      return {nullptr, 0};
    }
  }

  if (nPages == 1) {
    multiPage = false;
    if (staticAngle == 0) {
      nPages = 30;
    }
  }

  vector<VImage> img;
  int outPageHeight = pageHeight;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double rotation = staticAngle > 0 ? staticAngle : (double)360 * i / nPages;
    VImage rotated = img_frame.rotate(rotation);
    VImage embedded = staticAngle > 0 ? rotated
                                      : rotated.embed((width / 2) - (rotated.width() / 2),
                                                      (pageHeight / 2) - (rotated.height() / 2), width, pageHeight);
    outPageHeight = embedded.height();
    img.push_back(embedded);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, outPageHeight);
  if (!multiPage && staticAngle == 0) {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  if (outType != "webp" && staticAngle == 0) outType = "gif";

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
