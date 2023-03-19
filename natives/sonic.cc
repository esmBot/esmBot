#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Sonic(string type, string *outType, ArgumentMap Arguments,
            size_t *DataSize) {
  string text = GetArgument<string>(Arguments, "text");
  string basePath = GetArgument<string>(Arguments, "basePath");

  string assetPath = basePath + "assets/images/sonic.jpg";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  VImage textImage =
      VImage::text(
          ("<span foreground=\"white\">" + text + "</span>").c_str(),
          VImage::option()
              ->set("rgba", true)
              ->set("align", VIPS_ALIGN_CENTRE)
              ->set("font", "Verdana, Twemoji Color Font")
              ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
              ->set("width", 542)
              ->set("height", 390))
          .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 542, 390);

  VImage out = bg.composite2(textImage, VIPS_BLEND_MODE_OVER,
                             VImage::option()->set("x", 391)->set("y", 84));

  void *buf;
  out.write_to_buffer(("." + *outType).c_str(), &buf, DataSize);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}