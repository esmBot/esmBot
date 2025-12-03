#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::ColorsArgs = {
  {"color", {typeid(string), true}},
  {"shift", {typeid(int), false}  }
};

VImage sepia = VImage::new_matrixv(3, 3, 0.3588, 0.7044, 0.1368, 0.2990, 0.5870, 0.1140, 0.2392, 0.4696, 0.0912);

CmdOutput esmb::Image::Colors(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                              esmb::ArgumentMap arguments, bool *shouldKill) {
  string color = GetArgument<string>(arguments, "color");
  int shift = GetArgumentWithFallback<int>(arguments, "shift", 0);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);

  VImage out;

  if (color == "grayscale") {
    out = in.colourspace(VIPS_INTERPRETATION_B_W);
  } else if (color == "sepia") {
    out = in.extract_band(0, VImage::option()->set("n", 3)).recomb(sepia);
  } else if (color == "hueshift") {
    if (!in.has_alpha()) in = in.bandjoin(255);
    vector<double> shiftVec = {0, 0, static_cast<double>(shift), 0};
    out = in.colourspace(VIPS_INTERPRETATION_LCH) + shiftVec;
  }

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
