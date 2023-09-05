#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Homebrew(string type, string *outType, ArgumentMap Arguments,
                     size_t *DataSize) {
  string caption = GetArgument<string>(Arguments, "caption");
  string basePath = GetArgument<string>(Arguments, "basePath");

  string assetPath = basePath + "assets/images/hbc.png";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  loadFonts(basePath);
  VImage text = VImage::text(
      ("<span letter_spacing=\"-5120\" color=\"white\">" + caption + "</span>")
          .c_str(),
      VImage::option()
          ->set("rgba", true)
          ->set("align", VIPS_ALIGN_CENTRE)
          ->set("font", "PF Square Sans Pro 96")
          ->set("fontfile", (basePath + "assets/fonts/hbc.ttf").c_str()));

  VImage out = bg.composite2(text, VIPS_BLEND_MODE_OVER,
                             VImage::option()
                                 ->set("x", 400 - (text.width() / 2))
                                 ->set("y", 300 - (text.height() / 2) - 8));

  void *buf;
  out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}