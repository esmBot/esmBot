#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Sonic([[maybe_unused]] const string &type, string &outType, ArgumentMap arguments, bool *shouldKill) {
  string text = GetArgument<string>(arguments, "text");
  string basePath = GetArgument<string>(arguments, "basePath");

  string assetPath = basePath + "assets/images/sonic.jpg";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  LoadFonts(basePath);
  VImage textImage =
    VImage::text(("<span foreground=\"white\">" + text + "</span>").c_str(), VImage::option()
                                                                               ->set("rgba", true)
                                                                               ->set("align", VIPS_ALIGN_CENTRE)
                                                                               ->set("font", "Verdana")
                                                                               ->set("width", 542)
                                                                               ->set("height", 390))
      .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 542, 390);

  VImage out = bg.composite2(textImage, VIPS_BLEND_MODE_OVER, VImage::option()->set("x", 391)->set("y", 84));

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
