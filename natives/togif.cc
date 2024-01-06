#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap ToGif(const string& type, string& outType, const char* bufferdata, size_t bufferLength, [[maybe_unused]] ArgumentMap arguments, size_t& dataSize)
{
  if (type == "gif") {
    dataSize = bufferLength;
    char *data = (char *)malloc(bufferLength);
    memcpy(data, bufferdata, bufferLength);

    ArgumentMap output;
    output["buf"] = data;

    return output;

  } else {
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in = VImage::new_from_buffer(
        bufferdata, bufferLength, "",
        type == "webp" ? options->set("n", -1) : options);

    void *buf;
    in.write_to_buffer(".gif", &buf, &dataSize);
    outType = "gif";

    ArgumentMap output;
    output["buf"] = (char *)buf;

    return output;
  }
}
