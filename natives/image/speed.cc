#include <cstdint>
#include <vips/vips8>

#include "../common/riff.h"
#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::SpeedArgs = {
  {"slow",  {typeid(bool), false} },
  {"speed", {typeid(float), false}}
};

void *memset16(void *m, uint16_t val, size_t count) {
  uint16_t *buf = (uint16_t *)m;

  while (count--) *buf++ = val;
  return m;
}

char *vipsRemove(const char *data, size_t length, size_t &dataSize, float speed, string suffix, bool *shouldKill) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in = VImage::new_from_buffer(data, length, "", options->set("n", -1));

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  vector<VImage> img;
  for (float i = 0; i < nPages; i += speed) {
    VImage img_frame = in.crop(0, std::floor(i) * pageHeight, width, pageHeight);
    img.push_back(img_frame);
  }
  VImage out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  out.set(VIPS_META_PAGE_HEIGHT, pageHeight);

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  out.write_to_buffer(suffix.c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return buf;
}

CmdOutput esmb::Image::Speed([[maybe_unused]] const string &type, [[maybe_unused]] string &outType,
                             const char *bufferdata, size_t bufferLength, esmb::ArgumentMap arguments,
                             bool *shouldKill) {
  bool slow = GetArgumentWithFallback<bool>(arguments, "slow", false);
  float speed = GetArgumentWithFallback<float>(arguments, "speed", 2);

  size_t dataSize = 0;

  char *fileData = reinterpret_cast<char *>(malloc(bufferLength));
  memcpy(fileData, bufferdata, bufferLength);

  if (type == "gif") {
    const char *match = "\x00\x21\xF9\x04";

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
      free(fileData);
      fileData = vipsRemove(bufferdata, bufferLength, dataSize, speed, ".gif", shouldKill);
    } else {
      dataSize = bufferLength;
    }
  } else if (type == "webp") {
    size_t position = 12;
    bool removeFrames = false;

    int dataStart = 0;
    while ((dataStart = RIFF::findChunk(fileData, bufferLength, "ANMF", position, NULL)) != -1) {
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

    if (removeFrames) {
      free(fileData);
      fileData = vipsRemove(bufferdata, bufferLength, dataSize, speed, ".webp", shouldKill);
    } else {
      dataSize = bufferLength;
    }
  } else {
    dataSize = bufferLength;
  }

  return {fileData, dataSize};
}
