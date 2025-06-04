#include <vips/vips8>

#include "common.h"

void LoadFonts(string basePath) {
  // manually loading fonts to workaround some font issues with libvips
  if (!FcConfigAppFontAddDir(NULL, (const FcChar8 *)(basePath + "assets/fonts/").c_str())) {
    std::cerr << "Unable to load local font files from directory, falling back to "
                 "global fonts (which may be inaccurate!)"
              << std::endl;
  }
  if (!FcConfigParseAndLoad(FcConfigGetCurrent(), (const FcChar8 *)(basePath + "assets/fonts/fontconfig.xml").c_str(),
                            true)) {
    std::cerr << "Unable to load local fontconfig, some fonts may be inaccurate!" << std::endl;
  }
}

vips::VImage NormalizeVips(vips::VImage in, int *width, int *pageHeight, int nPages) {
  if (nPages > 1000) {
    throw -1;
  }

  vips::VImage out = in;

  double maxSize = std::max(*width, *pageHeight);
  if (maxSize > 800) {
    out = out.resize(800 / maxSize);
    *width = out.width();
    int newHeight = vips_image_get_page_height(out.get_image());
    *pageHeight = nPages > 1 ? newHeight / nPages : newHeight;
  }

  return out;
}

vips::VOption *GetInputOptions(string type, bool sequential, bool sequentialIfAnim) {
  bool anim = type == "gif" || type == "webp";
  vips::VOption *options = vips::VImage::option();

  if (anim) {
    options->set("n", -1);
    if (sequential && sequentialIfAnim) {
      options->set("access", "sequential");
    }
  }

  if (sequential && !sequentialIfAnim) {
    options->set("access", "sequential");
  }

  return options;
}

static void TimeoutCallback(VipsImage *image, [[maybe_unused]] VipsProgress *progress, CallbackData *data) {
  time_t now = time(0);
  bool *shouldKill = data->shouldKill;

  if (now > data->expiration || (shouldKill != NULL && *shouldKill)) {
    if (shouldKill != NULL) *shouldKill = true;
    vips_image_set_kill(image, true);
  }
}

void SetupTimeoutCallback(vips::VImage image, bool *shouldKill) {
  VipsImage *img = image.get_image();
  CallbackData *cbData = VIPS_NEW(img, CallbackData);
  cbData->expiration = time(0) + IMG_TIMEOUT;
  cbData->shouldKill = shouldKill;
  g_signal_connect(img, "eval", G_CALLBACK(TimeoutCallback), cbData);
  vips_image_set_progress(img, true);
}

uint32_t readUint32LE(unsigned char *buffer) {
  return static_cast<uint32_t>(buffer[0]) | (static_cast<uint32_t>(buffer[1]) << 8) |
         (static_cast<uint32_t>(buffer[2]) << 16) | (static_cast<uint32_t>(buffer[3]) << 24);
}
