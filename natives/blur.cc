#include <map>
#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Blur(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  bool sharp = GetArgument<bool>(arguments, "sharp");
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  // TODO: find a better way to calculate the intensity for GIFs without
  // splitting frames
  VImage out =
      sharp ? in.sharpen(VImage::option()->set("sigma", 3)) : in.gaussblur(15);


  char* buf;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);
  ArgumentMap output;
  output["buf"] = buf;
  return output;
}
