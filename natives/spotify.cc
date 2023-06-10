#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Spotify(string type, string *outType, char *BufferData,
                    size_t BufferLength, ArgumentMap Arguments,
                    size_t *DataSize) {
  string text = GetArgument<string>(Arguments, "caption");
  string basePath = GetArgument<string>(Arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  string assetPath = basePath + "assets/images/spotify.png";
  VImage tmpl = VImage::new_from_file(assetPath.c_str());

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  string captionText = "<span foreground=\"black\">" + text + "</span>";

  VImage textImage = VImage::text(
      captionText.c_str(),
      VImage::option()
          ->set("rgba", true)
          ->set("fontfile", (basePath + "assets/fonts/Circular.ttf").c_str())
          ->set("font", "Circular Bold")
          ->set("height", 75)
          ->set("width", 500)
          ->set("wrap", VIPS_TEXT_WRAP_NONE)
          ->set("align", VIPS_ALIGN_CENTRE));

  VImage composited = tmpl.composite2(
      textImage, VIPS_BLEND_MODE_OVER,
      VImage::option()
          ->set("x", (tmpl.width() / 2) - (textImage.width() / 2))
          ->set("y", 195));
  VImage watermark =
      composited.resize((double)width / (double)composited.width());

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = watermark.join(img_frame, VIPS_DIRECTION_VERTICAL,
                                  VImage::option()->set("expand", true));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + watermark.height());

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
