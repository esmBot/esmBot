#include <iostream>
#include <map>
#include <cinttypes>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

void *memset16(void *m, uint16_t val, size_t count) {
  uint16_t *buf = (uint16_t *)m;

  while (count--) *buf++ = val;
  return m;
}

char *vipsRemove(char *data, size_t length, size_t *DataSize, int speed) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in = VImage::new_from_buffer(data, length, "", options->set("n", -1))
                  .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

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

  void *buf;
  out.write_to_buffer(".gif", &buf, DataSize);

  return (char *)buf;
}

ArgumentMap Speed([[maybe_unused]] string type, string *outType, char *BufferData,
            size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  bool slow = GetArgumentWithFallback<bool>(Arguments, "slow", false);
  int speed = GetArgumentWithFallback<int>(Arguments, "speed", 2);

  char *fileData = (char *)malloc(BufferLength);
  memcpy(fileData, BufferData, BufferLength);

  char *match = (char *)"\x00\x21\xF9\x04";

  vector<uint16_t> old_delays;
  bool removeFrames = false;
  char *lastPos;

  // int amount = 0;

  lastPos = (char *)memchr(fileData, '\x00', BufferLength);
  while (lastPos != NULL) {
    if (memcmp(lastPos, match, 4) != 0) {
      lastPos = (char *)memchr(lastPos + 1, '\x00',
                               (BufferLength - (lastPos - fileData)) - 1);
      continue;
    }
    //++amount;
    uint16_t old_delay;
    memcpy(&old_delay, lastPos + 5, 2);
    old_delays.push_back(old_delay);
    lastPos = (char *)memchr(lastPos + 1, '\x00',
                             (BufferLength - (lastPos - fileData)) - 1);
  }

  int currentFrame = 0;
  lastPos = (char *)memchr(fileData, '\x00', BufferLength);
  while (lastPos != NULL) {
    if (memcmp(lastPos, match, 4) != 0) {
      lastPos = (char *)memchr(lastPos + 1, '\x00',
                               (BufferLength - (lastPos - fileData)) - 1);
      continue;
    }
    uint16_t new_delay = slow ? old_delays[currentFrame] * speed
                              : old_delays[currentFrame] / speed;
    if (!slow && new_delay <= 1) {
      removeFrames = true;
      break;
    }

    memset16(lastPos + 5, new_delay, 1);

    lastPos = (char *)memchr(lastPos + 1, '\x00',
                             (BufferLength - (lastPos - fileData)) - 1);
    ++currentFrame;
  }

  if (removeFrames) {
    fileData = vipsRemove(BufferData, BufferLength, DataSize, speed);
  } else {
    *DataSize = BufferLength;
  }

  ArgumentMap output;
  output["buf"] = fileData;

  return output;
}