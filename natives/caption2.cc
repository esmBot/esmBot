#include <map>
#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap CaptionTwo(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                       ArgumentMap arguments, bool *shouldKill) {
  bool top = GetArgument<bool>(arguments, "top");
  string caption = GetArgument<string>(arguments, "caption");
  string font = GetArgument<string>(arguments, "font");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int size = width / 13;
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  int textWidth = width - ((width / 25) * 2);

  string font_string = (font == "roboto" ? "Roboto Condensed" : font) + " " + to_string(size);

  string captionText = "<span background=\"white\">" + caption + "</span>";

  LoadFonts(basePath);
  auto findResult = fontPaths.find(font);
  VImage text =
    VImage::text(captionText.c_str(),
                 VImage::option()
                   ->set("rgba", true)
                   ->set("font", font_string.c_str())
                   ->set("fontfile", findResult != fontPaths.end() ? (basePath + findResult->second).c_str() : NULL)
                   ->set("align", VIPS_ALIGN_LOW)
                   ->set("width", textWidth));
  VImage captionImage =
    ((text == zeroVec).bandand())
      .ifthenelse(255, text)
      .embed(width / 25, width / 25, width, text.height() + size, VImage::option()->set("extend", "white"));

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = (top ? captionImage : img_frame)
                     .join(top ? img_frame : captionImage, VIPS_DIRECTION_VERTICAL,
                           VImage::option()->set("background", 0xffffff)->set("expand", true));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + captionImage.height());

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
