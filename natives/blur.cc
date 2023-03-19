#include <map>
#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Blur(string type, string *outType, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
  bool sharp = GetArgument<bool>(Arguments, "sharp");
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  // TODO: find a better way to calculate the intensity for GIFs without
  // splitting frames
  VImage out =
      sharp ? in.sharpen(VImage::option()->set("sigma", 3)) : in.gaussblur(15);

  void *buf;
  out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}
