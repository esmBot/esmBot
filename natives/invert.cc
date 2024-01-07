#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Invert(const string& type, string& outType, const char* bufferdata, size_t bufferLength, [[maybe_unused]] ArgumentMap arguments, size_t& dataSize)
{
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  VImage noAlpha =
      in.extract_band(0, VImage::option()->set("n", in.bands() - 1));
  VImage inverted = noAlpha.invert();
  VImage out = inverted.bandjoin(in.extract_band(3));

  char *buf;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
