#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Mirror(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                   ArgumentMap arguments, bool *shouldKill) {
  bool vertical = GetArgumentWithFallback<bool>(arguments, "vertical", false);
  bool first = GetArgumentWithFallback<bool>(arguments, "first", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, false, false));

  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  VImage out;

  if (vertical) {
    if (nPages > 1) {
      // once again, libvips animation handling is both a blessing and a curse
      vector<VImage> img;
      int pageHeight = vips_image_get_page_height(in.get_image());
      bool isOdd = pageHeight % 2;
      for (int i = 0; i < nPages; i++) {
        int x = (i * pageHeight) + (first ? 0 : (pageHeight / 2));
        VImage cropped = in.crop(0, x, in.width(), pageHeight / 2);
        VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
        VImage final =
          VImage::arrayjoin({first ? cropped : flipped, first ? flipped : cropped}, VImage::option()->set("across", 1));
        img.push_back(final);
      }
      out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      out.set(VIPS_META_PAGE_HEIGHT, pageHeight - (isOdd ? 1 : 0));
    } else {
      if (first) {
        VImage cropped = in.extract_area(0, 0, in.width(), in.height() / 2);
        VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
        out = VImage::arrayjoin({cropped, flipped}, VImage::option()->set("across", 1));
      } else {
        int size = in.height() / 2;
        VImage cropped = in.extract_area(0, size, in.width(), size);
        VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
        out = VImage::arrayjoin({flipped, cropped}, VImage::option()->set("across", 1));
      }
    }
  } else {
    if (first) {
      VImage cropped = in.extract_area(0, 0, in.width() / 2, in.height());
      VImage flipped = cropped.flip(VIPS_DIRECTION_HORIZONTAL);
      out = VImage::arrayjoin({cropped, flipped});
    } else {
      int size = in.width() / 2;
      VImage cropped = in.extract_area(size, 0, size, in.height());
      VImage flipped = cropped.flip(VIPS_DIRECTION_HORIZONTAL);
      out = VImage::arrayjoin({flipped, cropped});
    }
  }

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
