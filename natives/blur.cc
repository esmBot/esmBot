#include "common.h"

#include <map>
#include <string>
#include <vips/vips8>

using namespace std;
using namespace vips;

char *Blur(string type, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
  bool sharp = GetArgument<bool>(Arguments, "sharp");
  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha())
    in = in.bandjoin(255);

  // TODO: find a better way to calculate the intensity for GIFs without
  // splitting frames
  VImage out =
      sharp ? in.sharpen(VImage::option()->set("sigma", 3)) : in.gaussblur(15);

  void *buf;
  out.write_to_buffer(("." + type).c_str(), &buf, DataSize);

  vips_error_clear();
  vips_thread_shutdown();

  return (char *)buf;
}
