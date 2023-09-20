#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

VImage genText(string text, string font, const char *fontfile, int width,
               VImage mask, int radius) {
  VOption *options = VImage::option()
                         ->set("rgba", true)
                         ->set("align", VIPS_ALIGN_CENTRE)
                         ->set("font", font.c_str())
                         ->set("width", width);
  VImage in = VImage::text(
      ("<span foreground=\"white\">" + text + "</span>").c_str(),
      *fontfile == '\0' ? options->set("fontfile", fontfile) : options);

  in = in.embed(radius, radius * 2, in.width() + 2 * radius,
                (in.height() + 2 * radius) + (radius * 2));

  VImage newText = in.convsep(mask);
  VImage outline = newText.cast(VIPS_FORMAT_UCHAR) * zeroVecOneAlpha;
  return outline.composite2(in, VIPS_BLEND_MODE_OVER);
}

ArgumentMap Meme(string type, string *outType, char *BufferData,
                 size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  string top = GetArgument<string>(Arguments, "top");
  string bottom = GetArgument<string>(Arguments, "bottom");
  string font = GetArgument<string>(Arguments, "font");
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
  int size = width / 9;
  double radius = (double)size / 18;

  string font_string = (font == "roboto" ? "Roboto Condensed" : font) + " " +
                       (font != "impact" ? "bold" : "normal") + " " +
                       to_string(size);

  VImage mask = VImage::gaussmat(radius / 2, 0.1,
                                 VImage::option()->set("separable", true)) *
                8;

  auto findResult = fontPaths.find(font);
  string fontResult =
      findResult != fontPaths.end() ? basePath + findResult->second : "";

  loadFonts(basePath);
  VImage combinedText =
      VImage::black(width, pageHeight, VImage::option()->set("bands", 3))
          .bandjoin(0)
          .copy(VImage::option()->set("interpretation",
                                      VIPS_INTERPRETATION_sRGB));
  if (top != "") {
    VImage topText =
        genText(top, font_string, fontResult.c_str(), width, mask, radius);
    combinedText = combinedText.composite(
        topText, VIPS_BLEND_MODE_OVER,
        VImage::option()
            ->set("x", (width / 2) - (topText.width() / 2))
            ->set("y", 0));
  }

  if (bottom != "") {
    VImage bottomText =
        genText(bottom, font_string, fontResult.c_str(), width, mask, radius);
    combinedText = combinedText.composite(
        bottomText, VIPS_BLEND_MODE_OVER,
        VImage::option()
            ->set("x", (width / 2) - (bottomText.width() / 2))
            ->set("y", pageHeight - bottomText.height()));
  }

  VImage replicated = combinedText
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