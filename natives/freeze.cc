#include <algorithm>
#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Freeze(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  bool loop = GetArgumentWithFallback<bool>(arguments, "loop", false);
  int frame = GetArgumentWithFallback<int>(arguments, "frame", -1);

  char *fileData = reinterpret_cast<char*>(malloc(bufferLength));
  memcpy(fileData, bufferdata, bufferLength);

  char *match = const_cast<char*>("\x21\xFF\x0BNETSCAPE2.0\x03\x01");
  char *descriptor = const_cast<char*>("\x2C\x00\x00\x00\x00");
  char *lastPos;

  bool none = true;

  if (loop) {
    char *newData = reinterpret_cast<char*>(malloc(bufferLength + 19));
    memcpy(newData, fileData, bufferLength);
    lastPos = reinterpret_cast<char*>(memchr(newData, '\x2C', bufferLength));
    while (lastPos != NULL) {
      if (memcmp(lastPos, descriptor, 5) != 0) {
        lastPos = reinterpret_cast<char*>(memchr(lastPos + 1, '\x2C',
                                 (bufferLength - (lastPos - newData)) - 1));
        continue;
      }

      memcpy(lastPos + 19, lastPos, (bufferLength - (lastPos - newData)));
      memcpy(lastPos, match, 16);
      memcpy(lastPos + 16, "\x00\x00\x00", 3);

      none = false;
      dataSize = bufferLength + 19;
      break;
    }
    if (none) dataSize = bufferLength;

    ArgumentMap output;
    output["buf"] = newData;

    return output;
  } else if (frame >= 0 && !loop) {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(bufferdata, bufferLength, "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int framePos = clamp(frame, 1, (int)nPages);
    VImage out = in.crop(0, 0, in.width(), pageHeight * framePos);
    out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    out.set("loop", 1);

    char *buf;
    out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);

    ArgumentMap output;
    output["buf"] = buf;

    return output;
    
  } else {
    lastPos = reinterpret_cast<char*>(memchr(fileData, '\x21', bufferLength));
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 16) != 0) {
        lastPos = reinterpret_cast<char*>(memchr(lastPos + 1, '\x21',
                                 (bufferLength - (lastPos - fileData)) - 1));
        continue;
      }
      memcpy(lastPos, lastPos + 19, (bufferLength - (lastPos - fileData)) - 19);
      dataSize = bufferLength - 19;
      none = false;
      break;
    }
    if (none) dataSize = bufferLength;

    ArgumentMap output;
    output["buf"] = fileData;

    return output;
  }
}
