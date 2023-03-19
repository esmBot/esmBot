#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Motivate(string type, string *outType, char *BufferData,
               size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  string top_text = GetArgument<string>(Arguments, "top");
  string bottom_text = GetArgument<string>(Arguments, "bottom");
  string font = GetArgument<string>(Arguments, "font");
  string basePath = GetArgument<string>(Arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int size = width / 5;
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());
  int textWidth = width - ((width / 25) * 2);

  string font_string =
      (font == "roboto" ? "Roboto Condensed" : font) + ", Twemoji Color Font";

  auto findResult = fontPaths.find(font);
  if (findResult != fontPaths.end()) {
    VImage::text(".", VImage::option()->set(
                          "fontfile", (basePath + findResult->second).c_str()));
  }

  VImage topImage;
  if (top_text != "") {
    string topText = "<span foreground=\"white\" background=\"black\">" +
                     top_text + "</span>";

    topImage = VImage::text(
        topText.c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", (font_string + " " + to_string(size)).c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", textWidth));
  }

  VImage bottomImage;
  if (bottom_text != "") {
    string bottomText = "<span foreground=\"white\" background=\"black\">" +
                        bottom_text + "</span>";

    bottomImage = VImage::text(
        bottomText.c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", (font_string + " " + to_string(size * 0.4)).c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", textWidth));
  }

  vector<VImage> img;
  int height;
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

  void *buf;
  final.write_to_buffer(
      ("." + *outType).c_str(), &buf, DataSize,
      *outType == "gif" ? VImage::option()->set("dither", 1) : 0);

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}
