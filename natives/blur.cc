#include <map>
#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Blur(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 ArgumentMap arguments, bool *shouldKill) {
  bool sharp = GetArgument<bool>(arguments, "sharp");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false));

  VImage out = sharp ? in.sharpen(VImage::option()->set("sigma", 3)) : in.gaussblur(5);

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);
  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;
  return output;
}
