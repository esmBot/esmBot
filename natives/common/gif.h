#pragma once

#include <cstddef>

namespace GIF {
  enum : unsigned char {
    EXT_INTRODUCER = 0x21,
    EXT_GRAPHIC_CONTROL = 0xf9,
    IMAGE_SEPARATOR = 0x2c,
    TRAILER = 0x3b,
    BLOCK_TERMINATOR = 0x00,

    COLOUR_TABLE_MASK = 0x80,
    COLOUR_TABLE_SIZE_MASK = 0x07,
    MASK_TRANSPARENCY = 0x01,
    MASK_DISPOSAL = 0x1c,
    DISPOSAL_NONE = 1,

    HEADER_LEN = 13,
    SCREEN_WIDTH_OFFSET = 6,
    SCREEN_HEIGHT_OFFSET = 8,
    SCREEN_FLAGS_OFFSET = 10,

    IMAGE_DESCRIPTOR_LEN = 10,
    IMAGE_X_OFFSET = 1,
    IMAGE_Y_OFFSET = 3,
    IMAGE_WIDTH_OFFSET = 5,
    IMAGE_HEIGHT_OFFSET = 7,
    IMAGE_FLAGS_OFFSET = 9,

    GCE_LEN = 8,
    GCE_FLAGS_OFFSET = 3,
    GCE_DELAY_OFFSET = 4,
    GCE_TRANSPARENT_OFFSET = 6,
  };

  struct Block {
    size_t pos, end;
    unsigned char type;
    unsigned char label;
  };

  inline size_t colourTableSize(unsigned char flags) {
    return (flags & COLOUR_TABLE_MASK) ? 3 * (2 << (flags & COLOUR_TABLE_SIZE_MASK)) : 0;
  }

  // offset of first block after the header, screen descriptor, and global colour table
  // or 0 if this is not a GIF
  size_t firstBlock(const unsigned char *buf, size_t len);
  // reads the block at pos.  false if the block is truncated or garbage
  bool readBlock(const unsigned char *buf, size_t len, size_t pos, Block &block);

  inline bool isGce(const unsigned char *buf, const Block &block) {
    return block.type == EXT_INTRODUCER && block.label == EXT_GRAPHIC_CONTROL && block.end - block.pos == GCE_LEN &&
           buf[block.pos + 2] == 4;
  }
  inline int gceDisposal(const unsigned char *gce) { return (gce[GCE_FLAGS_OFFSET] & MASK_DISPOSAL) >> 2; }
} // namespace GIF
