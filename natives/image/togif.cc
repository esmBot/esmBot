#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

CmdOutput esmb::Image::ToGif(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                             [[maybe_unused]] esmb::ArgumentMap arguments, bool *shouldKill) {
  if (type == "gif") {
    char *data = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);

    return {data, bufferLength};
  } else {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", type == "webp" ? options->set("n", -1) : options);

    SetupTimeoutCallback(in, shouldKill);

    char *buf;
    size_t dataSize = 0;
    in.write_to_buffer(".gif", reinterpret_cast<void **>(&buf), &dataSize);
    outType = "gif";

    return {buf, dataSize};
  }
}
