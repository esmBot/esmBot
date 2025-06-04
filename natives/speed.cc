#include <cstdint>
#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

void *memset16(void *m, uint16_t val, size_t count) {
  uint16_t *buf = (uint16_t *)m;

  while (count--) *buf++ = val;
  return m;
}

char *vipsRemove(const char *data, size_t length, size_t &dataSize, int speed, string suffix, bool *shouldKill) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in = VImage::new_from_buffer(data, length, "", options->set("n", -1));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  vector<VImage> img;
  for (int i = 0; i < nPages; i += speed) {
    VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
    img.push_back(img_frame);
  }
  VImage out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  out.set(VIPS_META_PAGE_HEIGHT, pageHeight);

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  out.write_to_buffer(suffix.c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return buf;
}

ArgumentMap Speed([[maybe_unused]] const string &type, [[maybe_unused]] string &outType, const char *bufferdata,
                  size_t bufferLength, ArgumentMap arguments, bool *shouldKill) {
  bool slow = GetArgumentWithFallback<bool>(arguments, "slow", false);
  int speed = GetArgumentWithFallback<int>(arguments, "speed", 2);

  ArgumentMap output;
  size_t dataSize = 0;

  char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
  memcpy(fileData, bufferdata, bufferLength);

  if (type == "gif") {
    char *match = const_cast<char *>("\x00\x21\xF9\x04");

    vector<uint16_t> old_delays;
    bool removeFrames = false;
    char *lastPos;

    lastPos = reinterpret_cast<char *>(memchr(fileData, '\x00', bufferLength));
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 4) != 0) {
        lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x00', (bufferLength - (lastPos - fileData)) - 1));
        continue;
      }
      uint16_t old_delay;
      memcpy(&old_delay, lastPos + 5, 2);
      old_delays.push_back(old_delay);
      lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x00', (bufferLength - (lastPos - fileData)) - 1));
    }

    int currentFrame = 0;
    lastPos = reinterpret_cast<char *>(memchr(fileData, '\x00', bufferLength));
    while (lastPos != NULL) {
      if (memcmp(lastPos, match, 4) != 0) {
        lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x00', (bufferLength - (lastPos - fileData)) - 1));
        continue;
      }
      uint16_t new_delay = slow ? old_delays[currentFrame] * speed : old_delays[currentFrame] / speed;
      if (!slow && new_delay <= 1) {
        removeFrames = true;
        break;
      }

      memset16(lastPos + 5, new_delay, 1);

      lastPos = reinterpret_cast<char *>(memchr(lastPos + 1, '\x00', (bufferLength - (lastPos - fileData)) - 1));
      ++currentFrame;
    }

    if (removeFrames) {
      fileData = vipsRemove(bufferdata, bufferLength, dataSize, speed, ".gif", shouldKill);
    } else {
      dataSize = bufferLength;
    }
  } else if (type == "webp") {
    size_t position = 12;
    bool removeFrames = false;

    while (position + 8 <= bufferLength) {
      const char *fourCC = &fileData[position];
      uint32_t chunkSize = readUint32LE(reinterpret_cast<unsigned char *>(fileData) + position + 4);

      if (memcmp(fourCC, "ANMF", 4) == 0) {
        size_t dataStart = position + 8;
        uint32_t duration = readUint32LE(reinterpret_cast<unsigned char *>(fileData) + dataStart + 12) & 0x00FFFFFF;
        uint32_t newDuration = slow ? duration * speed : duration / speed;
        if (!slow && newDuration <= 10) {
          removeFrames = true;
          break;
        }

        fileData[dataStart + 12] = static_cast<uint8_t>(newDuration & 0xFF);
        fileData[dataStart + 13] = static_cast<uint8_t>((newDuration >> 8) & 0xFF);
        fileData[dataStart + 14] = static_cast<uint8_t>((newDuration >> 16) & 0xFF);
      }

      position += 8 + chunkSize + (chunkSize % 2);
    }

    if (removeFrames) {
      fileData = vipsRemove(bufferdata, bufferLength, dataSize, speed, ".webp", shouldKill);
    } else {
      dataSize = bufferLength;
    }
  } else {
    dataSize = bufferLength;
  }

  output["buf"] = fileData;
  output["size"] = dataSize;

  return output;
}
