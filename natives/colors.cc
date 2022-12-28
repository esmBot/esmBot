#include "common.h"

#include <map>
#include <string>
#include <vips/vips8>

using namespace std;
using namespace vips;

VImage sepia = VImage::new_matrixv(3, 3, 0.3588, 0.7044, 0.1368, 0.2990, 0.5870,
                                   0.1140, 0.2392, 0.4696, 0.0912);

char *Colors(string *type, char *BufferData, size_t BufferLength,
             ArgumentMap Arguments, size_t *DataSize) {

  string color = GetArgument<string>(Arguments, "color");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              *type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  VImage out;

  if (color == "grayscale") {
    out = in.colourspace(VIPS_INTERPRETATION_B_W);
  } else if (color == "sepia") {
    out = in.extract_band(0, VImage::option()->set("n", 3)).recomb(sepia);
  }

  void *buf;
  out.write_to_buffer(("." + *type).c_str(), &buf, DataSize);

  vips_error_clear();
  vips_thread_shutdown();

  return (char *)buf;
}
