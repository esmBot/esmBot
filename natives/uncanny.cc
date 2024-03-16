#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Uncanny(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  string caption = GetArgument<string>(arguments, "caption");
  string caption2 = GetArgument<string>(arguments, "caption2");
  string font = GetArgument<string>(arguments, "font");
  string path = GetArgument<string>(arguments, "path");
  string basePath = GetArgument<string>(arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB)
          .extract_band(0, VImage::option()->set("n", 3));

  VImage base = VImage::black(1280, 720, VImage::option()->set("bands", 3));

  string font_string = (font == "roboto" ? "Roboto Condensed" : font) + " " +
                       (font != "impact" ? "bold" : "normal") + " 72";

  string captionText =
      "<span background=\"black\" foreground=\"white\">" + caption + "</span>";
  string caption2Text =
      "<span background=\"black\" foreground=\"red\">" + caption2 + "</span>";

  auto findResult = fontPaths.find(font);
  string fontResult =
      findResult != fontPaths.end() ? basePath + findResult->second : "";

  LoadFonts(basePath);
  VOption *textOptions = VImage::option()
                                 ->set("rgba", true)
                                 ->set("align", VIPS_ALIGN_CENTRE)
                                 ->set("font", font_string.c_str())
                                 ->set("width", 588)
                                 ->set("height", 90);
  if (fontResult != "") {
    textOptions = textOptions->set(
        "fontfile", fontResult.c_str());
  }
  VImage text = VImage::text(captionText.c_str(),
                             textOptions);
  VImage captionImage =
      text.extract_band(0, VImage::option()->set("n", 3))
          .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 640, text.height() + 40,
                   VImage::option()->set("extend", "black"));

  VOption *textOptions2 = VImage::option()
                                 ->set("rgba", true)
                                 ->set("align", VIPS_ALIGN_CENTRE)
                                 ->set("font", font_string.c_str())
                                 ->set("width", 588)
                                 ->set("height", 90);
  if (fontResult != "") {
    textOptions2 = textOptions2->set(
        "fontfile", fontResult.c_str());
  }
  VImage text2 = VImage::text(caption2Text.c_str(),
                              textOptions2);
  VImage caption2Image =
      text2.extract_band(0, VImage::option()->set("n", 3))
          .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 640, text.height() + 40,
                   VImage::option()->set("extend", "black"));

  base = base.insert(captionImage, 0, 0).insert(caption2Image, 640, 0);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  VImage uncanny = VImage::new_from_file((basePath + path).c_str());

  base = base.insert(uncanny, 0, 130);

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage resized = img_frame.resize(690.0 / (double)width);
    if (resized.height() > 590) {
      double vscale = 590.0 / (double)resized.height();
      resized = resized.resize(vscale, VImage::option()->set("vscale", vscale));
    }
    VImage composited = base.insert(resized, 935 - (resized.width() / 2),
                                    425 - (resized.height() / 2));
    img.push_back(composited);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, 720);

  char *buf;
  final.write_to_buffer(
      ("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize,
      outType == "gif" ? VImage::option()->set("reoptimise", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
