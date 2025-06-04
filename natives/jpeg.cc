#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Jpeg(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 ArgumentMap arguments, bool *shouldKill) {
  int quality = GetArgumentWithFallback<int>(arguments, "quality", 1);

  char *buf;
  size_t dataSize = 0;

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false));

  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  if (nPages > 1) {
    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int totalHeight = in.height();

    VImage final;

    if (totalHeight > 65500) {
      vector<VImage> img;
      for (int i = 0; i < nPages; i++) {
        VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
        void *jpgBuf;
        size_t jpgLength;
        img_frame.write_to_buffer(".jpg", &jpgBuf, &jpgLength, VImage::option()->set("Q", quality)->set("strip", true));
        VImage jpeged = VImage::new_from_buffer(jpgBuf, jpgLength, "");
        jpeged.set(VIPS_META_PAGE_HEIGHT, pageHeight);
        jpeged.set("delay", in.get_array_int("delay"));
        img.push_back(jpeged);
      }
      final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    } else {
      void *jpgBuf;
      size_t jpgLength;
      in.write_to_buffer(".jpg", &jpgBuf, &jpgLength, VImage::option()->set("Q", quality)->set("strip", true));
      final = VImage::new_from_buffer(jpgBuf, jpgLength, "");
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      final.set("delay", in.get_array_int("delay"));
    }

    final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                          outType == "gif" ? VImage::option()->set("dither", 0) : 0);
  } else {
    void *jpgBuf;
    in.write_to_buffer(".jpg", &jpgBuf, &dataSize, VImage::option()->set("Q", quality)->set("strip", true));
    if (outType == "gif") {
      VImage gifIn = VImage::new_from_buffer(reinterpret_cast<char *>(jpgBuf), dataSize, "");
      gifIn.write_to_buffer(".gif", reinterpret_cast<void **>(&buf), &dataSize, VImage::option()->set("strip", true));
    } else {
      outType = "jpg";
      buf = reinterpret_cast<char *>(jpgBuf);
    }
  }

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
