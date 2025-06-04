#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap ToGif(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                  [[maybe_unused]] ArgumentMap arguments, bool *shouldKill) {
  if (type == "gif") {
    char *data = reinterpret_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);

    ArgumentMap output;
    output["buf"] = data;
    output["size"] = bufferLength;

    return output;

  } else {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", type == "webp" ? options->set("n", -1) : options);

    SetupTimeoutCallback(in, shouldKill);

    char *buf;
    size_t dataSize = 0;
    in.write_to_buffer(".gif", reinterpret_cast<void **>(&buf), &dataSize);
    outType = "gif";

    ArgumentMap output;
    output["buf"] = buf;
    output["size"] = dataSize;

    return output;
  }
}
