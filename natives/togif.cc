#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

char *ToGif(string *type, char *BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t *DataSize) {
  if (*type == "gif") {
    *DataSize = BufferLength;
    return BufferData;
  } else {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in = VImage::new_from_buffer(
        BufferData, BufferLength, "",
        *type == "webp" ? options->set("n", -1) : options);

    void *buf;
    in.write_to_buffer(".gif", &buf, DataSize);
    *type = "gif";

    return (char *)buf;
  }
}