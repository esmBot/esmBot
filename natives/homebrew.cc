#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Homebrew([[maybe_unused]] const string &type, string &outType, ArgumentMap arguments, bool *shouldKill) {
  string caption = GetArgument<string>(arguments, "caption");
  string basePath = GetArgument<string>(arguments, "basePath");

  string assetPath = basePath + "assets/images/hbc.png";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  LoadFonts(basePath);
  VImage text = VImage::text(("<span letter_spacing=\"-5120\" color=\"white\">" + caption + "</span>").c_str(),
                             VImage::option()
                               ->set("rgba", true)
                               ->set("align", VIPS_ALIGN_CENTRE)
                               ->set("font", "PF Square Sans Pro 96")
                               ->set("fontfile", (basePath + "assets/fonts/hbc.ttf").c_str()));

  VImage out =
    bg.composite2(text, VIPS_BLEND_MODE_OVER,
                  VImage::option()->set("x", 400 - (text.width() / 2))->set("y", 300 - (text.height() / 2) - 8));

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
