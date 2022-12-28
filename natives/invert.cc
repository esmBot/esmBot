#include "common.h"

#include <vips/vips8>

using namespace std;
using namespace vips;

char *Invert(string *type, char *BufferData, size_t BufferLength,
             ArgumentMap Arguments, size_t *DataSize) {

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              *type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha())
    in = in.bandjoin(255);

  VImage noAlpha =
      in.extract_band(0, VImage::option()->set("n", in.bands() - 1));
  VImage inverted = noAlpha.invert();
  VImage out = inverted.bandjoin(in.extract_band(3));

  void *buf;
  out.write_to_buffer(("." + *type).c_str(), &buf, DataSize);

  vips_error_clear();
  vips_thread_shutdown();
  return (char *)buf;
}