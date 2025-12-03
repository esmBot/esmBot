#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::BlurArgs = {
  {"sharp", {typeid(bool), false}}
};

CmdOutput esmb::Image::Blur(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                            esmb::ArgumentMap arguments, bool *shouldKill) {
  bool sharp = GetArgumentWithFallback<bool>(arguments, "sharp", false);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false));

  VImage out = sharp ? in.sharpen(VImage::option()->set("sigma", 3)) : in.gaussblur(5);

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);
  return {buf, dataSize};
}
