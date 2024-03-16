#include <map>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Watermark(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  string water = GetArgument<string>(arguments, "water");
  int gravity = GetArgument<int>(arguments, "gravity");

  bool resize = GetArgumentWithFallback<bool>(arguments, "resize", false);
  float yscale = GetArgumentWithFallback<float>(arguments, "yscale", false);

  bool append = GetArgumentWithFallback<bool>(arguments, "append", false);

  bool alpha = GetArgumentWithFallback<bool>(arguments, "alpha", false);
  bool flipX = GetArgumentWithFallback<bool>(arguments, "flipX", false);
  bool flipY = GetArgumentWithFallback<bool>(arguments, "flipY", false);

  bool mc = MapContainsKey(arguments, "mc");

  string basePath = GetArgument<string>(arguments, "basePath");

  VOption *options = VImage::option()->set("access", "sequential");

  VImage in =
      VImage::new_from_buffer(bufferdata, bufferLength, "",
                              type == "gif" ? options->set("n", -1) : options)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  string merged = basePath + water;
  VImage watermark = VImage::new_from_file(merged.c_str());

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  if (flipX) {
    watermark = watermark.flip(VIPS_DIRECTION_HORIZONTAL);
  }

  if (flipY) {
    watermark = watermark.flip(VIPS_DIRECTION_VERTICAL);
  }

  if (resize) {
    if (append) {
      watermark = watermark.resize((double)width / (double)watermark.width());
    } else if (yscale) {
      watermark = watermark.resize(
          (double)width / (double)watermark.width(),
          VImage::option()->set("vscale", (double)(pageHeight * yscale) /
                                              (double)watermark.height()));
    } else {
      watermark =
          watermark.resize((double)pageHeight / (double)watermark.height());
    }
  }

  int x = 0, y = 0;
  switch (gravity) {
    case 1:
      break;
    case 2:
      x = (width / 2) - (watermark.width() / 2);
      break;
    case 3:
      x = width - watermark.width();
      break;
    case 5:
      x = (width / 2) - (watermark.width() / 2);
      y = (pageHeight / 2) - (watermark.height() / 2);
      break;
    case 6:
      x = width - watermark.width();
      y = (pageHeight / 2) - (watermark.height() / 2);
      break;
    case 8:
      x = (width / 2) - (watermark.width() / 2);
      y = pageHeight - watermark.height();
      break;
    case 9:
      x = width - watermark.width();
      y = pageHeight - watermark.height();
      break;
  }

  vector<VImage> img;
  int addedHeight = 0;
  VImage contentAlpha;
  VImage frameAlpha;
  VImage bg;
  VImage frame;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    if (append) {
      VImage appended = img_frame.join(watermark, VIPS_DIRECTION_VERTICAL,
                                       VImage::option()->set("expand", true));
      addedHeight = watermark.height();
      img.push_back(appended);
    } else if (mc) {
      VImage padded =
          img_frame.embed(0, 0, width, pageHeight + 15,
                          VImage::option()->set("background", 0xffffff));
      VImage composited =
          padded.composite2(watermark, VIPS_BLEND_MODE_OVER,
                            VImage::option()
                                ->set("x", width - 190)
                                ->set("y", padded.height() - 22));
      addedHeight = 15;
      img.push_back(composited);
    } else {
      VImage composited;
      if (alpha) {
        if (i == 0) {
          contentAlpha = watermark.extract_band(0).embed(
              x, y, width, pageHeight,
              VImage::option()->set("extend", "white"));
          frameAlpha = watermark.extract_band(1).embed(
              x, y, width, pageHeight,
              VImage::option()->set("extend", "black"));
          bg = frameAlpha.new_from_image({0, 0, 0}).copy(VImage::option()->set(
              "interpretation", VIPS_INTERPRETATION_sRGB));
          frame = bg.bandjoin(frameAlpha);
          if (outType == "jpg" || outType == "jpeg") {
            outType = "png";
          }
        }
        VImage content =
            img_frame.extract_band(0, VImage::option()->set("n", 3))
                .bandjoin(contentAlpha & img_frame.extract_band(3));

        composited =
            content.composite2(frame, VIPS_BLEND_MODE_OVER,
                               VImage::option()->set("x", x)->set("y", y));
      } else {
        composited =
            img_frame.composite2(watermark, VIPS_BLEND_MODE_OVER,
                                 VImage::option()->set("x", x)->set("y", y));
      }
      img.push_back(composited);
    }
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + addedHeight);

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
