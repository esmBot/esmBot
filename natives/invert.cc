#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Invert(string type, string *outType, char *BufferData,
             size_t BufferLength, [[maybe_unused]] ArgumentMap Arguments,
             size_t *DataSize) {
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  VImage noAlpha =
      in.extract_band(0, VImage::option()->set("n", in.bands() - 1));
  VImage inverted = noAlpha.invert();
  VImage out = inverted.bandjoin(in.extract_band(3));

  void *buf;
  out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}