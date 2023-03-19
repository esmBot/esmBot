#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Jpeg(string type, string *outType, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
  int quality = GetArgumentWithFallback<int>(Arguments, "quality", 0);

  void *buf;

  if (type == "gif") {
    VImage in = VImage::new_from_buffer(
                    BufferData, BufferLength, "",
                    VImage::option()->set("access", "sequential")->set("n", -1))
                    .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int totalHeight = in.height();
    int nPages = vips_image_get_n_pages(in.get_image());

    VImage final;

    if (totalHeight > 65500) {
      vector<VImage> img;
      for (int i = 0; i < nPages; i++) {
        VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
        void *jpgBuf;
        size_t jpgLength;
        img_frame.write_to_buffer(
            ".jpg", &jpgBuf, &jpgLength,
            VImage::option()->set("Q", quality)->set("strip", true));
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
      in.write_to_buffer(
          ".jpg", &jpgBuf, &jpgLength,
          VImage::option()->set("Q", quality)->set("strip", true));
      final = VImage::new_from_buffer(jpgBuf, jpgLength, "");
      final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      final.set("delay", in.get_array_int("delay"));
    }

    final.write_to_buffer(
        ("." + *outType).c_str(), &buf, DataSize,
        *outType == "gif" ? VImage::option()->set("dither", 0) : 0);
  } else {
    VImage in = VImage::new_from_buffer(BufferData, BufferLength, "");
    void *jpgBuf;
    in.write_to_buffer(".jpg", &jpgBuf, DataSize,
                       VImage::option()->set("Q", quality)->set("strip", true));
    if (*outType == "gif") {
      VImage gifIn = VImage::new_from_buffer((char *)jpgBuf, *DataSize, "");
      gifIn.write_to_buffer(
          ".gif", &buf, DataSize,
          VImage::option()->set("Q", quality)->set("strip", true));
    } else {
      *outType = "jpg";
      buf = jpgBuf;
    }
  }

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}
