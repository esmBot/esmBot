#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::JpegArgs = {
  {"quality", {typeid(int), false}}
};

CmdOutput esmb::Image::Jpeg(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                            esmb::ArgumentMap arguments, bool *shouldKill) {
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
        VImage jpeged = VImage::new_from_buffer(jpgBuf, jpgLength, "", VImage::option()->set("access", "sequential"));
        img.push_back(jpeged.copy_memory());
        free(jpgBuf);
      }
      final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      final.set("delay", in.get_array_int("delay"));
      final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                            outType == "gif" ? VImage::option()->set("dither", 0) : 0);
    } else {
      void *jpgBuf;
      size_t jpgLength;
      in.write_to_buffer(".jpg", &jpgBuf, &jpgLength, VImage::option()->set("Q", quality)->set("strip", true));
      final = VImage::new_from_buffer(jpgBuf, jpgLength, "", VImage::option()->set("access", "sequential"));
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      final.set("delay", in.get_array_int("delay"));
      final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                            outType == "gif" ? VImage::option()->set("dither", 0) : 0);
      free(jpgBuf);
    }
  } else {
    void *jpgBuf;
    in.write_to_buffer(".jpg", &jpgBuf, &dataSize, VImage::option()->set("Q", quality)->set("strip", true));
    if (outType == "gif") {
      VImage gifIn = VImage::new_from_buffer(jpgBuf, dataSize, "", VImage::option()->set("access", "sequential"));
      gifIn.write_to_buffer(".gif", reinterpret_cast<void **>(&buf), &dataSize, VImage::option()->set("strip", true));
      free(jpgBuf);
    } else {
      outType = "jpg";
      buf = reinterpret_cast<char *>(jpgBuf);
    }
  }

  return {buf, dataSize};
}
