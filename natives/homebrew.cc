#include "common.h"

#include <vips/vips8>

using namespace std;
using namespace vips;

char *Homebrew(string *type, ArgumentMap Arguments, size_t *DataSize) {
  string caption = GetArgument<string>(Arguments, "caption");
  string basePath = GetArgument<string>(Arguments, "basePath");

  string assetPath = basePath + "assets/images/hbc.png";
  VImage bg = VImage::new_from_file(assetPath.c_str());

  VImage text = VImage::text(
      ".", VImage::option()->set("fontfile",
                                 (basePath + "assets/fonts/hbc.ttf").c_str()));
  text = VImage::text(
      ("<span letter_spacing=\"-5120\" color=\"white\">" + caption + "</span>")
          .c_str(),
      VImage::option()
          ->set("rgba", true)
          ->set("align", VIPS_ALIGN_CENTRE)
          ->set("font", "PF Square Sans Pro, Twemoji Color Font 96")
          ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str()));

  VImage out = bg.composite2(text, VIPS_BLEND_MODE_OVER,
                             VImage::option()
                                 ->set("x", 400 - (text.width() / 2))
                                 ->set("y", 300 - (text.height() / 2) - 8));

  void *buf;
  out.write_to_buffer(".png", &buf, DataSize);

  *type = "png";

  vips_error_clear();
  vips_thread_shutdown();
  return (char *)buf;
}