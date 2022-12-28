#include "common.h"

#include <vips/vips8>

using namespace std;
using namespace vips;

char *Whisper(string *type, char *BufferData, size_t BufferLength,
              ArgumentMap Arguments, size_t *DataSize) {
  string caption = GetArgument<string>(Arguments, "caption");
  string basePath = GetArgument<string>(Arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
                              *type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha())
    in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());
  int size = width / 6;
  int dividedWidth = width / 175;
  int rad = 1;

  string font_string = "Upright, Twemoji Color Font " + to_string(size);

  VImage mask;
  if (dividedWidth >= 1) {
    mask = VImage::black(dividedWidth * 2 + 1, dividedWidth * 2 + 1) + 128;
    mask.draw_circle({255}, dividedWidth, dividedWidth, dividedWidth,
                     VImage::option()->set("fill", true));
  } else {
    mask = VImage::black(rad * 2 + 1, rad * 2 + 1) + 128;
    mask.draw_circle({255}, rad, rad, rad, VImage::option()->set("fill", true));
  }

  VImage textIn = VImage::text(
      ".", VImage::option()->set(
               "fontfile", (basePath + "assets/fonts/whisper.otf").c_str()));
  textIn = VImage::text(
      ("<span foreground=\"white\">" + caption + "</span>").c_str(),
      VImage::option()
          ->set("rgba", true)
          ->set("align", VIPS_ALIGN_CENTRE)
          ->set("font", font_string.c_str())
          ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
          ->set("width", width));

  textIn = textIn.embed(rad + 10, rad + 10, (textIn.width() + 2 * rad) + 20,
                        (textIn.height() + 2 * rad) + 20);

  VImage outline = textIn.morph(mask, VIPS_OPERATION_MORPHOLOGY_DILATE)
                       .gaussblur(0.5, VImage::option()->set("min_ampl", 0.1));
  outline = (outline == (vector<double>){0, 0, 0, 0});
  VImage invert = outline.extract_band(3).invert();
  outline =
      outline.extract_band(0, VImage::option()->set("n", outline.bands() - 1))
          .bandjoin(invert);
  VImage textImg = outline.composite2(textIn, VIPS_BLEND_MODE_OVER);

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        *type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    img_frame = img_frame.composite2(
        textImg, VIPS_BLEND_MODE_OVER,
        VImage::option()
            ->set("x", (width / 2) - (textImg.width() / 2))
            ->set("y", (pageHeight / 2) - (textImg.height() / 2)));
    img.push_back(img_frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);

  void *buf;
  final.write_to_buffer(
      ("." + *type).c_str(), &buf, DataSize,
      *type == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
                     : 0);

  vips_error_clear();
  vips_thread_shutdown();
  return (char *)buf;
}