#ifdef LQR_ENABLED
#include <vips/vips8>
#include <lqr.h>

#include <algorithm>
#include <cstring>
#include <stdexcept>
#include <vector>

#include "common.h"

using namespace std;
using namespace vips;

static const int MAGIK_MAX_INTERMEDIATE = 200;

static VImage LqrRescale(VImage img, int target_w, int target_h) {
  if (img.format() != VIPS_FORMAT_UCHAR) {
    img = img.cast(VIPS_FORMAT_UCHAR);
  }

  int w = img.width();
  int h = img.height();
  int c = img.bands();

  size_t mem_size;
  void *mem = img.write_to_memory(&mem_size);

  LqrCarver *carver = lqr_carver_new_ext(mem, w, h, c, LQR_COLDEPTH_8I);
  if (carver == NULL) {
    g_free(mem);
    throw std::runtime_error("magik: could not allocate the seam carver");
  }

  if (lqr_carver_init(carver, 0, 0) != LQR_OK || lqr_carver_resize(carver, target_w, target_h) != LQR_OK) {
    lqr_carver_destroy(carver);
    throw std::runtime_error("magik: seam carving failed");
  }

  int out_w = lqr_carver_get_width(carver);
  int out_h = lqr_carver_get_height(carver);

  size_t out_size = (size_t)out_w * out_h * c;
  unsigned char *out_mem = static_cast<unsigned char *>(g_malloc(out_size));

  lqr_carver_scan_reset(carver);
  int x, y;
  void *rgb;
  while (lqr_carver_scan_ext(carver, &x, &y, &rgb)) {
    memcpy(&out_mem[((size_t)y * out_w + x) * c], rgb, c);
  }

  lqr_carver_destroy(carver);

  VImage out = VImage::new_from_memory_copy(out_mem, out_size, out_w, out_h, c, VIPS_FORMAT_UCHAR)
                 .copy(VImage::option()->set("interpretation", img.interpretation()));
  g_free(out_mem);

  return out;
}

CmdOutput esmb::Image::Magik(const string &type, string &outType, const char *bufferdata,
                             size_t bufferLength, [[maybe_unused]] esmb::ArgumentMap arguments,
                             bool *shouldKill) {
  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, false))
                 .colourspace(VIPS_INTERPRETATION_sRGB);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      outType = "frames";
      return {nullptr, 0};
    }
  }

  int carveWidth = width / 2;
  int carveHeight = pageHeight / 2;

  double maxSize = max(carveWidth, carveHeight);
  if (maxSize > MAGIK_MAX_INTERMEDIATE) {
    double scale = MAGIK_MAX_INTERMEDIATE / maxSize;
    carveWidth *= scale;
    carveHeight *= scale;
  }

  if (carveWidth < 3 || carveHeight < 3) {
    outType = "small";
    return {nullptr, 0};
  }

  vector<VImage> frames;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = nPages > 1 ? in.crop(0, i * pageHeight, width, pageHeight) : in;

    img_frame = LqrRescale(img_frame, carveWidth, carveHeight);
    img_frame = LqrRescale(img_frame, width, pageHeight);

    frames.push_back(img_frame);
  }

  VImage out = VImage::arrayjoin(frames, VImage::option()->set("across", 1));
  out.set(VIPS_META_PAGE_HEIGHT, frames[0].height());
  if (nPages > 1) {
    out.set("delay", in.get_array_int("delay"));
    out.set("loop", in.get_int("loop"));
  }

  SetupTimeoutCallback(out, shouldKill);

  char *buf;
  size_t dataSize = 0;
  out.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  return {buf, dataSize};
}
#endif
