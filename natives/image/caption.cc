#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::CaptionArgs = {
  {"caption",    {typeid(string), true} },
  {"font",       {typeid(string), false}},
  {"avatarPath", {typeid(string), false}},
  {"basePath",   {typeid(string), true} }
};

CmdOutput esmb::Image::Caption(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                               esmb::ArgumentMap arguments, bool *shouldKill) {
  string caption = GetArgument<string>(arguments, "caption");
  string font = GetArgumentWithFallback<string>(arguments, "font", "futura");
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                .colourspace(VIPS_INTERPRETATION_sRGB)
                .copy_memory();

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

  // Prepare avatar watermark if provided
  string avatarPath = GetArgumentWithFallback<string>(arguments, "avatarPath", "");
  bool hasAvatar = !avatarPath.empty();
  VImage circularAvatar;
  int avatarX = 0, avatarY = 0;

  if (hasAvatar) {
    int avatarSize = max(width / 8, 24);
    int padding = max(width / 50, 4);

    VImage avatarRaw = VImage::new_from_file(avatarPath.c_str());
    avatarRaw = avatarRaw.colourspace(VIPS_INTERPRETATION_sRGB);

    // Crop to square from center, then resize
    int minDim = min(avatarRaw.width(), avatarRaw.height());
    int cropX = (avatarRaw.width() - minDim) / 2;
    int cropY = (avatarRaw.height() - minDim) / 2;
    VImage avatarSquare = avatarRaw.crop(cropX, cropY, minDim, minDim);
    VImage avatar = avatarSquare.resize((double)avatarSize / (double)minDim);

    // Flatten alpha if present (onto white background)
    if (avatar.has_alpha()) {
      avatar = avatar.flatten(VImage::option()->set("background", vector<double>{255, 255, 255}));
    }
    // Ensure exactly 3 bands
    if (avatar.bands() > 3) {
      avatar = avatar.extract_band(0, VImage::option()->set("n", 3));
    }

    // Create circular mask
    VImage mask = VImage::black(avatarSize, avatarSize).copy_memory();
    mask.draw_circle({255.0}, avatarSize / 2, avatarSize / 2, avatarSize / 2, VImage::option()->set("fill", true));

    circularAvatar = avatar.bandjoin(mask).copy_memory();

    int newPageHeight = pageHeight + captionImage.height();
    avatarX = width - avatarSize - padding;
    avatarY = newPageHeight - avatarSize - padding;
  }

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage frame = captionImage.join(img_frame, VIPS_DIRECTION_VERTICAL,
                                     VImage::option()->set("background", 0xffffff)->set("expand", true));
    if (hasAvatar) {
      frame = frame.composite2(circularAvatar, VIPS_BLEND_MODE_OVER,
                               VImage::option()->set("x", avatarX)->set("y", avatarY));
    }
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight + captionImage.height());

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1) : 0);

  return {buf, dataSize};
}
