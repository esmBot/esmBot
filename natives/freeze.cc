#include <algorithm>
#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

char *vipsTrim(const char *data, size_t length, size_t &dataSize, int frame, string suffix, string outType,
               bool *shouldKill) {
  VImage in = VImage::new_from_buffer(data, length, "", GetInputOptions(suffix, true, false));

  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());
  int framePos = clamp(frame, 1, (int)nPages);
  VImage out = in.crop(0, 0, in.width(), pageHeight * framePos);
  out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  out.set("loop", 1);

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return buf;
}

ArgumentMap Freeze(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                   ArgumentMap arguments, bool *shouldKill) {
  bool loop = GetArgumentWithFallback<bool>(arguments, "loop", false);
  int frame = GetArgumentWithFallback<int>(arguments, "frame", -1);

  ArgumentMap output;
  size_t dataSize = 0;

  if (type == "gif") {
    char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(fileData, bufferdata, bufferLength);

    char *match = const_cast<char *>("\x21\xFF\x0BNETSCAPE2.0\x03\x01");
    char *descriptor = const_cast<char *>("\x2C\x00\x00\x00\x00");
    char *lastPos;

    bool none = true;

    if (loop) {
      char *newData = reinterpret_cast<char *>(malloc(bufferLength + 19));
      memcpy(newData, fileData, bufferLength);
      lastPos = reinterpret_cast<char *>(memchr(newData, '\x2C', bufferLength));
      while (lastPos != NULL) {
        if (memcmp(lastPos, descriptor, 5) != 0) {
          lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x2C', (bufferLength - (lastPos - newData)) - 1));
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

      output["buf"] = newData;
    } else if (frame >= 0 && !loop) {
      char *buf = vipsTrim(bufferdata, bufferLength, dataSize, frame, type, outType, shouldKill);
      output["buf"] = buf;
    } else {
      lastPos = reinterpret_cast<char *>(memchr(fileData, '\x21', bufferLength));
      while (lastPos != NULL) {
        if (memcmp(lastPos, match, 16) != 0) {
          lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x21', (bufferLength - (lastPos - fileData)) - 1));
          continue;
        }
        memcpy(lastPos, lastPos + 19, (bufferLength - (lastPos - fileData)) - 19);
        dataSize = bufferLength - 19;
        none = false;
        break;
      }
      if (none) dataSize = bufferLength;

      output["buf"] = fileData;
    }
    output["size"] = dataSize;
  } else if (type == "webp") {
    if (frame >= 0 && !loop) {
      char *buf = vipsTrim(bufferdata, bufferLength, dataSize, frame, type, outType, shouldKill);
      output["buf"] = buf;
      output["size"] = dataSize;
    } else {
      char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
      memcpy(fileData, bufferdata, bufferLength);

      size_t position = 12;

      while (position + 8 <= bufferLength) {
        const char *fourCC = &fileData[position];
        uint32_t chunkSize = readUint32LE(reinterpret_cast<unsigned char *>(fileData) + position + 4);

        if (memcmp(fourCC, "ANIM", 4) == 0) {
          size_t dataStart = position + 8;

          fileData[dataStart + 4] = loop ? 0 : 1;
          fileData[dataStart + 5] = 0;
        }

        position += 8 + chunkSize + (chunkSize % 2);
      }

      output["buf"] = fileData;
      output["size"] = bufferLength;
    }
  } else {
    char *data = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);
    output["buf"] = data;
    output["size"] = bufferLength;
  }

  return output;
}
