#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Caption(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                    ArgumentMap arguments, bool *shouldKill) {
  string caption = GetArgument<string>(arguments, "caption");
  string font = GetArgument<string>(arguments, "font");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int size = width / 10;
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  int textWidth = width - ((width / 25) * 2);

  string font_string = (font == "roboto" ? "Roboto Condensed" : font) + " " + (font != "impact" ? "bold" : "normal") +
                       " " + to_string(size);

  string captionText = "<span background=\"white\">" + caption + "</span>";

  LoadFonts(basePath);
  auto findResult = fontPaths.find(font);
  VImage text =
    VImage::text(captionText.c_str(),
                 VImage::option()
                   ->set("rgba", true)
                   ->set("align", VIPS_ALIGN_CENTRE)
                   ->set("font", font_string.c_str())
                   ->set("fontfile", findResult != fontPaths.end() ? (basePath + findResult->second).c_str() : NULL)
                   ->set("width", textWidth));
  VImage captionImage =
    ((text == zeroVec).bandand())
      .ifthenelse(255, text)
      .gravity(VIPS_COMPASS_DIRECTION_CENTRE, width, text.height() + size, VImage::option()->set("extend", "white"));

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = captionImage.join(img_frame, VIPS_DIRECTION_VERTICAL,
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
