#include <cstring>

#include "../shared.h"
#include "riff.h"

int RIFF::findChunk(char *data, size_t length, const char *chunk, size_t &position, uint32_t *size) {
  int pos = -1;
  uint32_t chunkSize = 0;
  while (position + 8 <= length && pos == -1) {
    const char *fourCC = &data[position];
    chunkSize = readUint32LE(reinterpret_cast<unsigned char *>(data) + position + 4);

    if (memcmp(fourCC, chunk, 4) == 0) {
      pos = position + 8;
    }

    position += 8 + chunkSize + (chunkSize % 2);
  }
  if (size != NULL) *size = chunkSize;
  return pos;
}
