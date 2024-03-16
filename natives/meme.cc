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
      strncmp(fontfile, "\0", 1) != 0 ? options->set("fontfile", fontfile) : options);

  in = in.embed(radius, radius * 2, in.width() + 2 * radius,
                (in.height() + 2 * radius) + (radius * 2));

  VImage newText = in.convsep(mask);
  VImage outline = newText.cast(VIPS_FORMAT_UCHAR) * zeroVecOneAlpha;
  return outline.composite2(in, VIPS_BLEND_MODE_OVER);
}

ArgumentMap Meme(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  string top = GetArgument<string>(arguments, "topText");
  string bottom = GetArgument<string>(arguments, "bottomText");
  string font = GetArgument<string>(arguments, "font");
  string basePath = GetArgument<string>(arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
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

  LoadFonts(basePath);
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

  char *buf;
  final.write_to_buffer(
      ("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize,
      outType == "gif"
          ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
          : 0);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
