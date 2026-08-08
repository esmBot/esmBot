#include <string>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::CaptionImageArgs = {
  {"overlayPath", {typeid(string), true}}
};

CmdOutput esmb::Image::CaptionImage(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                                    esmb::ArgumentMap arguments, bool *shouldKill) {
  string overlayPath = GetArgument<string>(arguments, "overlayPath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB);

  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  VImage overlay = VImage::new_from_file(overlayPath.c_str()).colourspace(VIPS_INTERPRETATION_sRGB);
  overlay = overlay.resize((double)width / overlay.width());
  if (!overlay.has_alpha()) overlay = overlay.bandjoin(255);
  vips_image_remove(overlay.get_image(), VIPS_META_N_PAGES);
  vips_image_remove(overlay.get_image(), VIPS_META_PAGE_HEIGHT);
  vips_image_remove(overlay.get_image(), "delay");
  vips_image_remove(overlay.get_image(), "loop");

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = img_frame.insert(overlay, 0, -overlay.height(),
                                    VImage::option()->set("background", 0xffffff)->set("expand", true));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + overlay.height());
  final.set(VIPS_META_N_PAGES, nPages);
  if (vips_image_get_typeof(in.get_image(), "delay")) final.set("delay", in.get_array_int("delay"));
  if (vips_image_get_typeof(in.get_image(), "loop")) final.set("loop", in.get_int("loop"));

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  return {buf, dataSize};
}
