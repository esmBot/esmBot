#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

CmdOutput esmb::Image::Deepfry(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                               [[maybe_unused]] esmb::ArgumentMap arguments, bool *shouldKill) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int totalHeight = in.height();
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  VImage fried = (in * 1.3 - 76.5) * 1.5;

  VImage final;
  if (totalHeight > 65500 && nPages > 1) {
    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame = fried.crop(0, i * pageHeight, width, pageHeight);
      void *jpgBuf;
      size_t jpgLength;
      img_frame.write_to_buffer(".jpg", &jpgBuf, &jpgLength, VImage::option()->set("Q", 1)->set("strip", true));
      VImage jpeged = VImage::new_from_buffer(jpgBuf, jpgLength, "", VImage::option()->set("access", "sequential"));
      img.push_back(jpeged.copy_memory());
      free(jpgBuf);
    }
    final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    final.set("delay", fried.get_array_int("delay"));
  } else {
    void *jpgBuf;
    size_t jpgLength;
    fried.write_to_buffer(".jpg", &jpgBuf, &jpgLength, VImage::option()->set("Q", 1)->set("strip", true));
    final = VImage::new_from_buffer(jpgBuf, jpgLength, "", VImage::option()->set("access", "sequential")).copy_memory();
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    if (nPages > 1) final.set("delay", fried.get_array_int("delay"));
    free(jpgBuf);
  }

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0) : 0);

  return {buf, dataSize};
}
