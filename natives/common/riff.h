#pragma once

#include <cstddef>
#include <cstdint>

namespace RIFF {
  struct RIFFHeader {
    char riff[4];
    uint32_t chunkSize;
    char tag[4];
  };

  struct ChunkHeader {
    char id[4];
    uint32_t size;
  };

  int findChunk(char *data, size_t length, const char *fourCC, size_t &position, uint32_t *size);
} // namespace RIFF
