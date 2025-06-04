#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Spin(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 [[maybe_unused]] ArgumentMap arguments, bool *shouldKill) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  bool multiPage = true;

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

  if (nPages == 1) {
    multiPage = false;
    nPages = 30;
  }

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double rotation = (double)360 * i / nPages;
    VImage rotated = img_frame.similarity(VImage::option()->set("angle", rotation));
    VImage embedded =
      rotated.embed((width / 2) - (rotated.width() / 2), (pageHeight / 2) - (rotated.height() / 2), width, pageHeight);
    img.push_back(embedded);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  if (!multiPage) {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void **>(&buf), &dataSize);

  if (outType != "webp") outType = "gif";

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
