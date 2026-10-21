#include <cstring>

#include "gif.h"

namespace GIF {
  // returns the offset just past the sub-block terminator, or 0 if truncated
  static size_t skipSubBlocks(const unsigned char *buf, size_t len, size_t pos) {
    while (pos < len) {
      unsigned char size = buf[pos];
      pos += 1 + size;
      if (size == BLOCK_TERMINATOR) return pos <= len ? pos : 0;
    }
    return 0;
  }

  size_t firstBlock(const unsigned char *buf, size_t len) {
    if (len < HEADER_LEN || memcmp(buf, "GIF8", 4) != 0) return 0;
    size_t pos = HEADER_LEN + colourTableSize(buf[SCREEN_FLAGS_OFFSET]);
    return pos < len ? pos : 0;
  }

  bool readBlock(const unsigned char *buf, size_t len, size_t pos, Block &block) {
    if (pos >= len) return false;
    block.pos = pos;
    block.type = buf[pos];
    if (block.type == IMAGE_SEPARATOR) {
      if (pos + IMAGE_DESCRIPTOR_LEN + 1 > len) return false;
      block.label = 0;
      block.end =
        skipSubBlocks(buf, len, pos + IMAGE_DESCRIPTOR_LEN + colourTableSize(buf[pos + IMAGE_FLAGS_OFFSET]) + 1);
    } else if (block.type == EXT_INTRODUCER && pos + 2 <= len) {
      block.label = buf[pos + 1];
      block.end = skipSubBlocks(buf, len, pos + 2);
    } else
      return false;
    return block.end != 0;
  }
} // namespace GIF
