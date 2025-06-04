#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Invert(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                   [[maybe_unused]] ArgumentMap arguments, bool *shouldKill) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false));

  bool hasAlpha = in.has_alpha();

  VImage noAlpha = hasAlpha ? in.extract_band(0, VImage::option()->set("n", in.bands() - 1)) : in;
  VImage inverted = noAlpha.invert();
  VImage out = hasAlpha ? inverted.bandjoin(in.extract_band(in.bands() - 1)) : inverted;

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
