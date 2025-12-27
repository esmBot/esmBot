#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

CmdOutput esmb::Image::Wall(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                            [[maybe_unused]] esmb::ArgumentMap arguments, bool *shouldKill) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, false, false));
  if (!in.has_alpha()) in = in.bandjoin(255);

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

  // We fit one tile inside a 128x128 box in order to
  // reduce resolution, then blow it up to 512x512
  double maxSize = std::max(width, pageHeight);
  // We find a vertical scaling factor that ensures
  // all pages have the same height. This prevents
  // a weird scrolling effect that happens when we
  // later crop out each page.
  double vscale = (int)(pageHeight * (128.0 / maxSize)) / (double)pageHeight;
  VImage tile = in.resize(128.0 / maxSize, VImage::option()->set("vscale", vscale));
  tile = tile.resize(512.0 / 128.0).copy_memory();
  int newHeight = tile.height();
  width = tile.width();
  pageHeight = nPages > 1 ? newHeight / nPages : newHeight;

  // This distortion matrix was computed with `getPerspectiveTransform`
  // from OpenCV, with the original ImageMagick set of points:
  // {0, 0, 57, 42, 0, 128, 63, 130, 128, 0, 140, 60, 128, 128, 140, 140}
  double T[] = {1.32996610e+00, -9.06795066e-02, -7.19995282e+01, -2.75152214e-01,
                1.26875743e+00, -3.76041359e+01, -7.70327830e-04, -7.08433645e-04};
  VImage i = VImage::xyz(512, 512);

  VImage xi = (i[0] * T[0] + i[1] * T[1] + T[2]) / (i[0] * T[6] + i[1] * T[7] + 1);
  VImage yi = (i[0] * T[3] + i[1] * T[4] + T[5]) / (i[0] * T[6] + i[1] * T[7] + 1);
  xi = xi % width;
  yi = yi % pageHeight;
  VImage index = xi.bandjoin(yi).copy_memory();

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? tile.crop(0, i * pageHeight, width, pageHeight) : tile;
    // The 'extend' here doesn't do the tiling, it just fixes
    // a weird border that forms around each tile.
    VImage frame = img_frame.mapim(index, VImage::option()->set("extend", VIPS_EXTEND_REPEAT));
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, 512);

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
