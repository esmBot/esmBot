#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Spin(const string& type, string& outType, const char* bufferdata,
                 size_t bufferLength, [[maybe_unused]] ArgumentMap arguments,
                 size_t& dataSize) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "",
                                      type == "gif"
                                          ? VImage::option()->set("n", -1)->set(
                                                "access", "sequential")
                                          : 0)
                  .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 30;

  try {
    in = NormalizeVips(in, type, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      ArgumentMap output;
      output["buf"] = "";
      outType = "frames";
      return output;
    }
  }

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    double rotation = (double)360 * i / nPages;
    VImage rotated = img_frame.similarity(
        VImage::option()->set("angle", rotation));
    VImage embedded = rotated.embed(
        (width / 2) - (rotated.width() / 2),
        (pageHeight / 2) - (rotated.height() / 2), width, pageHeight);
    img.push_back(embedded);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  if (type != "gif") {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  char* buf;
  final.write_to_buffer(".gif", reinterpret_cast<void**>(&buf), &dataSize);

  outType = "gif";

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
