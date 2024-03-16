#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Motivate(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  string top_text = GetArgument<string>(arguments, "topText");
  string bottom_text = GetArgument<string>(arguments, "bottomText");
  string font = GetArgument<string>(arguments, "font");
  string basePath = GetArgument<string>(arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int size = width / 5;
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());
  int textWidth = width - ((width / 25) * 2);

  string font_string = font == "roboto" ? "Roboto Condensed" : font;
  auto findResult = fontPaths.find(font);
  string fontResult =
      findResult != fontPaths.end() ? basePath + findResult->second : "";

  LoadFonts(basePath);
  VImage topImage;
  if (top_text != "") {
    string topText = "<span foreground=\"white\" background=\"black\">" +
                     top_text + "</span>";

    VOption *topTextOptions =
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("width", textWidth)
            ->set("font", (font_string + " " + to_string(size)).c_str());
    if (fontResult != "") {
      topTextOptions = topTextOptions->set(
          "fontfile", (basePath + findResult->second).c_str());
    }
    topImage = VImage::text(topText.c_str(), topTextOptions);
  }

  VImage bottomImage;
  if (bottom_text != "") {
    string bottomText = "<span foreground=\"white\" background=\"black\">" +
                        bottom_text + "</span>";

    VOption *bottomTextOptions =
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("width", textWidth)
            ->set("font", (font_string + " " + to_string(size * 0.4)).c_str());
    if (fontResult != "") {
      bottomTextOptions = bottomTextOptions->set(
          "fontfile", (basePath + findResult->second).c_str());
    }
    bottomImage = VImage::text(bottomText.c_str(), bottomTextOptions);
  }

  vector<VImage> img;
  int height = 0;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;

    int borderSize = max(2, width / 66);
    int borderSize2 = borderSize * 0.5;
    VImage bordered =
        img_frame.embed(borderSize, borderSize, width + (borderSize * 2),
                        pageHeight + (borderSize * 2),
                        VImage::option()->set("extend", "black"));
    VImage bordered2 = bordered.embed(borderSize2, borderSize2,
                                      bordered.width() + (borderSize2 * 2),
                                      bordered.height() + (borderSize2 * 2),
                                      VImage::option()->set("extend", "white"));

    int addition = width / 8;
    int sideAddition = pageHeight * 0.4;

    VImage bordered3 = bordered2.embed(
        sideAddition / 2, addition / 2, bordered2.width() + sideAddition,
        bordered2.height() + addition,
        VImage::option()->set("extend", "black"));
    VImage frame;
    if (top_text != "") {
      frame = bordered3.join(
          topImage.gravity(VIPS_COMPASS_DIRECTION_NORTH, bordered3.width(),
                           topImage.height() + (size / 4),
                           VImage::option()->set("extend", "black")),
          VIPS_DIRECTION_VERTICAL,
          VImage::option()->set("background", 0x000000)->set("expand", true));
    }
    if (bottom_text != "") {
      if (top_text == "") frame = bordered3;
      frame = frame.join(
          bottomImage.gravity(VIPS_COMPASS_DIRECTION_NORTH, bordered3.width(),
                              bottomImage.height() + (size / 4),
                              VImage::option()->set("extend", "black")),
          VIPS_DIRECTION_VERTICAL,
          VImage::option()->set("background", 0x000000)->set("expand", true));
    }
    height = frame.height();
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1))
                     .extract_band(0, VImage::option()->set("n", 3));
  final.set(VIPS_META_PAGE_HEIGHT, height);

  char *buf;
  final.write_to_buffer(
      ("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize,
      outType == "gif" ? VImage::option()->set("dither", 1) : 0);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
