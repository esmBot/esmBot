#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Whisper(string type, string *outType, char *BufferData,
                    size_t BufferLength, ArgumentMap Arguments,
                    size_t *DataSize) {
  string caption = GetArgument<string>(Arguments, "caption");
  string basePath = GetArgument<string>(Arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());
  int size = width / 6;
  double rad = (double)size / 24;

  string font_string = "Upright " + to_string(size);

  VImage mask =
      VImage::gaussmat(rad / 2, 0.1, VImage::option()->set("separable", true)) *
      8;

  loadFonts(basePath);
  VImage textIn = VImage::text(
      ("<span foreground=\"white\">" + caption + "</span>").c_str(),
      VImage::option()
          ->set("rgba", true)
          ->set("align", VIPS_ALIGN_CENTRE)
          ->set("font", font_string.c_str())
          ->set("fontfile", (basePath + "assets/fonts/whisper.otf").c_str())
          ->set("width", width));

  textIn = textIn.embed(rad, rad, textIn.width() + 2 * rad,
                        textIn.height() + 2 * rad);

  VImage newText = textIn.convsep(mask);
  VImage outline = newText.cast(VIPS_FORMAT_UCHAR) * zeroVecOneAlpha;
  VImage composited = outline.composite2(textIn, VIPS_BLEND_MODE_OVER);
  VImage textImg = composited.embed(
      (width / 2) - (composited.width() / 2),
      (pageHeight / 2) - (composited.height() / 2), width, pageHeight);

  VImage replicated = textImg
                          .copy(VImage::option()->set("interpretation",
                                                      VIPS_INTERPRETATION_sRGB))
                          .replicate(1, nPages);
  VImage final = in.composite(replicated, VIPS_BLEND_MODE_OVER);

  void *buf;
  final.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif"
          ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
          : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}