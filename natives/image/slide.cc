#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::SlideArgs = {
  {"vertical", {typeid(bool), false}},
  {"reverse",  {typeid(bool), false}},
};

CmdOutput esmb::Image::Slide(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                             esmb::ArgumentMap arguments, bool *shouldKill) {
  bool vertical = GetArgumentWithFallback<bool>(arguments, "vertical", false);
  bool reverse = GetArgumentWithFallback<bool>(arguments, "reverse", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true))
                .colourspace(VIPS_INTERPRETATION_sRGB);

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
    nPages = 15;
  }

  char reverseMult = reverse ? -1 : 1;

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = img_frame.wrap(VImage::option()
                                    ->set("x", vertical ? 0 : (width * reverseMult) * i / nPages)
                                    ->set("y", vertical ? (pageHeight * reverseMult) * i / nPages : 0));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  if (!multiPage) {
    vector<int> delay(15, 50);
    final.set("delay", delay);
  }

  if (outType != "webp") outType = "gif";

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
