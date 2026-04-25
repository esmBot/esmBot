#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::RedditArgs = {
  {"caption",  {typeid(string), true}},
  {"basePath", {typeid(string), true}}
};

CmdOutput esmb::Image::Reddit(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                              esmb::ArgumentMap arguments, bool *shouldKill) {
  string text = GetArgument<string>(arguments, "caption");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  string assetPath = basePath + "assets/images/reddit.png";
  VImage tmpl = VImage::new_from_file(assetPath.c_str());

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  string captionText = "<span foreground=\"white\">Posted in r/" + text + "</span>";

  LoadFonts(basePath);

  // this is a bit of a hack.
  // to properly align the text, we need to ensure that the baseline matches;
  // however, depending on the content, this can vary wildly if we just use the
  // standard method of rendering text.
  // therefore, we need to know the offset - but this info is not provided to us directly either,
  // so we need to calculate it by rendering some other text and getting the baseline from there.
  VImage baselineCalc = VImage::text(
    "A", VImage::option()->set("font", "Roboto 62")->set("fontfile", (basePath + "assets/fonts/reddit.ttf").c_str()));
  size_t baseline = baselineCalc.height() + baselineCalc.yoffset();

  VImage textImage =
    VImage::text(captionText.c_str(), VImage::option()
                                        ->set("rgba", true)
                                        ->set("font", "Roboto 62")
                                        ->set("fontfile", (basePath + "assets/fonts/reddit.ttf").c_str()));

  VImage composited = tmpl.composite2(
    textImage, VIPS_BLEND_MODE_OVER,
    VImage::option()->set("x", (int)64)->set("y", (tmpl.height() - baseline) - 64 + textImage.yoffset()));
  VImage watermark = composited.resize((double)width / (double)composited.width());

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = img_frame.join(watermark, VIPS_DIRECTION_VERTICAL, VImage::option()->set("expand", true));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + watermark.height());

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  return {buf, dataSize};
}
