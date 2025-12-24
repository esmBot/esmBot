#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

FunctionArgs esmb::Image::PetpetArgs = {
  {"basePath", {typeid(string), true}}
};

CmdOutput esmb::Image::Petpet(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                              [[maybe_unused]] esmb::ArgumentMap arguments, bool *shouldKill) {
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true));
  if (!in.has_alpha()) in = in.bandjoin(255);

  double squish = 1.25;
  double sizeOffset = 1.125;
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  int width = in.width();

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      outType = "frames";
      return {nullptr, 0};
    }
  }

  // The output needs to have atleast 10 pages
  // so we can go through the whole hand animation.
  int nOutPages = std::max(nPages, 10);

  string assetPath = basePath + "assets/images/petpet.gif";
  VImage hand = VImage::new_from_file(assetPath.c_str(), GetInputOptions("gif", true, true));

  double minSize = std::min(width, pageHeight);
  VImage hand_frames[10];
  for (int i = 0; i < 10; i++) {
    hand_frames[i] = hand.crop(0, i * 112, 112, 112).resize(minSize * sizeOffset / 112.0);
  }

  // These offsets to make the bouncing effect
  // are in pixels, and work for a 112x112 output.
  // Taken from: https://benisland.neocities.org/petpet/
  double frameOffsets[5][4] = {
    {0,   0,  0,  0  }, // x, y, width, height.
    {-4,  12, 4,  -12},
    {-12, 18, 12, -18},
    {-8,  12, 4,  -12},
    {-4,  0,  0,  0  },
  };

  vector<VImage> img;
  int newWidth = width * sizeOffset;
  int newPageHeight = pageHeight * sizeOffset;
  for (int i = 0; i < nOutPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, (i % nPages) * pageHeight, width, pageHeight) : in;
    VImage hand_frame = hand_frames[i % 10];
    double scale = 1.0 + (frameOffsets[i / 2 % 5][2] * squish / 112.0);
    double vscale = 1.0 + (frameOffsets[i / 2 % 5][3] * squish / 112.0);
    int dx = width * (frameOffsets[i / 2 % 5][0] * squish / 112.0);
    int dy = pageHeight * (frameOffsets[i / 2 % 5][1] * squish / 112.0);

    VImage frame = img_frame.resize(scale, VImage::option()->set("vscale", vscale))
                     .embed((newWidth)-width + dx, (newPageHeight)-pageHeight + dy, newWidth, newPageHeight)
                     .composite2(hand_frame, VIPS_BLEND_MODE_OVER);
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, newPageHeight);

  vector<int> delay(nOutPages, 30);
  final.set("delay", delay);

  SetupTimeoutCallback(final, shouldKill);

  if (outType != "webp") outType = "gif";

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
