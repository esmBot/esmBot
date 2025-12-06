#include <algorithm>
#include <vips/vips8>

#include "../common/riff.h"
#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::FreezeArgs = {
  {"loop",  {typeid(bool), false}},
  {"frame", {typeid(int), false} }
};

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

CmdOutput esmb::Image::Freeze(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                              esmb::ArgumentMap arguments, bool *shouldKill) {
  bool loop = GetArgumentWithFallback<bool>(arguments, "loop", false);
  int frame = GetArgumentWithFallback<int>(arguments, "frame", -1);

  CmdOutput output;
  size_t dataSize = 0;

  if (type == "gif") {
    const char *match = "\x21\xFF\x0BNETSCAPE2.0\x03\x01";
    const char *descriptor = "\x2C\x00\x00\x00\x00";
    char *lastPos;

    bool none = true;

    if (loop) {
      char *fileData = reinterpret_cast<char *>(malloc(bufferLength + 19));
      memcpy(fileData, bufferdata, bufferLength);
      lastPos = reinterpret_cast<char *>(memchr(fileData, '\x2C', bufferLength));
      while (lastPos != NULL) {
        if (memcmp(lastPos, descriptor, 5) != 0) {
          lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x2C', (bufferLength - (lastPos - fileData)) - 1));
          continue;
        }

        memcpy(lastPos + 19, lastPos, (bufferLength - (lastPos - fileData)));
        memcpy(lastPos, match, 16);
        memcpy(lastPos + 16, "\x00\x00\x00", 3);

        none = false;
        dataSize = bufferLength + 19;
        break;
      }
      if (none) dataSize = bufferLength;

      output.buf = fileData;
    } else if (frame >= 0 && !loop) {
      char *buf = vipsTrim(bufferdata, bufferLength, dataSize, frame, type, outType, shouldKill);
      output.buf = buf;
    } else {
      char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
      memcpy(fileData, bufferdata, bufferLength);
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

      output.buf = fileData;
    }
    output.length = dataSize;
  } else if (type == "webp") {
    if (frame >= 0 && !loop) {
      char *buf = vipsTrim(bufferdata, bufferLength, dataSize, frame, type, outType, shouldKill);
      output.buf = buf;
      output.length = dataSize;
    } else {
      char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
      memcpy(fileData, bufferdata, bufferLength);

      size_t position = 12;

      int dataStart = 0;
      while ((dataStart = RIFF::findChunk(fileData, bufferLength, "ANIM", position, NULL)) != -1) {
        fileData[dataStart + 4] = loop ? 0 : 1;
        fileData[dataStart + 5] = 0;
      }

      output.buf = fileData;
      output.length = bufferLength;
    }
  } else {
    char *data = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);
    output.buf = data;
    output.length = bufferLength;
  }

  return output;
}
