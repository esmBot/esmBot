#include <algorithm>
#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Freeze(string type, string *outType, char *BufferData,
             size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  bool loop = GetArgumentWithFallback<bool>(Arguments, "loop", false);
  int frame = GetArgumentWithFallback<int>(Arguments, "frame", -1);

  char *fileData = (char *)malloc(BufferLength);
  memcpy(fileData, BufferData, BufferLength);

  char *match = (char *)"\x21\xFF\x0BNETSCAPE2.0\x03\x01";
  char *descriptor = (char *)"\x2C\x00\x00\x00\x00";
  char *lastPos;

  bool none = true;

  if (loop) {
    char *newData = (char *)malloc(BufferLength + 19);
    memcpy(newData, fileData, BufferLength);
    lastPos = (char *)memchr(newData, '\x2C', BufferLength);
    while (lastPos != NULL) {
      if (memcmp(lastPos, descriptor, 5) != 0) {
        lastPos = (char *)memchr(lastPos + 1, '\x2C',
                                 (BufferLength - (lastPos - newData)) - 1);
        continue;
      }

      memcpy(lastPos + 19, lastPos, (BufferLength - (lastPos - newData)));
      memcpy(lastPos, match, 16);
      memcpy(lastPos + 16, "\x00\x00\x00", 3);

      none = false;
      *DataSize = BufferLength + 19;
      break;
    }
    if (none) *DataSize = BufferLength;

    ArgumentMap output;
    output["buf"] = newData;

    return output;
  } else if (frame >= 0 && !loop) {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(BufferData, BufferLength, "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int framePos = clamp(frame, 0, (int)nPages);
    VImage out = in.crop(0, 0, in.width(), pageHeight * (framePos + 1));
    out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    out.set("loop", 1);

    void *buf;
    out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

    ArgumentMap output;
    output["buf"] = (char *)buf;

    return output;
    
  } else {
    lastPos = (char *)memchr(fileData, '\x21', BufferLength);
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 16) != 0) {
        lastPos = (char *)memchr(lastPos + 1, '\x21',
                                 (BufferLength - (lastPos - fileData)) - 1);
        continue;
      }
      memcpy(lastPos, lastPos + 19, (BufferLength - (lastPos - fileData)) - 19);
      *DataSize = BufferLength - 19;
      none = false;
      break;
    }
    if (none) *DataSize = BufferLength;

    ArgumentMap output;
    output["buf"] = fileData;

    return output;
  }
}
