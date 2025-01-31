#include <algorithm>
#include <map>
#include <vips/vips8>
#include <webp/mux.h>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Freeze(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  bool loop = GetArgumentWithFallback<bool>(arguments, "loop", false);
  int frame = GetArgumentWithFallback<int>(arguments, "frame", -1);

  ArgumentMap output;

  if (type == "gif") {
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

      output["buf"] = newData;
    } else if (frame >= 0 && !loop) {
      VImage in =
          VImage::new_from_buffer(bufferdata, bufferLength, "",
                                  GetInputOptions(type, true, false));

      int pageHeight = vips_image_get_page_height(in.get_image());
      int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
      int framePos = clamp(frame, 1, (int)nPages);
      VImage out = in.crop(0, 0, in.width(), pageHeight * framePos);
      out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      out.set("loop", 1);

      char *buf;
      out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);

      output["buf"] = buf;
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

      output["buf"] = fileData;
    }
  } else if (type == "webp") {
    WebPData webp_data;
    WebPDataInit(&webp_data);
    webp_data.bytes = (const uint8_t *)bufferdata;
    webp_data.size = bufferLength;
    int copy_data = 0;
    WebPMux *mux = WebPMuxCreate(&webp_data, copy_data);

    WebPMuxAnimParams anim;
    WebPMuxError err;
    err = WebPMuxGetAnimationParams(mux, &anim);
    if (err > 0) {
      anim.loop_count = loop ? 0 : 1;
      if (frame >= 0 && !loop) {
        while (err > 0) {
          err = WebPMuxDeleteFrame(mux, frame + 1);
        }
      }
      WebPMuxSetAnimationParams(mux, &anim);
    }

    WebPData out;
    WebPMuxAssemble(mux, &out);

    dataSize = out.size;
    char *data = reinterpret_cast<char*>(malloc(dataSize));
    memcpy(data, out.bytes, dataSize);

    WebPDataClear(&out);

    output["buf"] = data;
    
    WebPDataInit(&webp_data);
    WebPMuxDelete(mux);
  } else {
    char *data = reinterpret_cast<char*>(malloc(dataSize));
    memcpy(data, bufferdata, dataSize);
    output["buf"] = data;
  }

  return output;
}
