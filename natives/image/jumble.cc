#include <vips/vips8>

#include <algorithm>
#include <random>

#include "common.h"

using namespace std;
using namespace vips;

auto rng = default_random_engine{};

FunctionArgs esmb::Image::JumbleArgs = {
  {"groupsize", {typeid(int), false}}
};

CmdOutput esmb::Image::Jumble(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                              esmb::ArgumentMap arguments, bool *shouldKill) {
  int groupSize = GetArgumentWithFallback<int>(arguments, "groupsize", 3);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, false, false));

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

  // this command is useless with single-page images
  if (nPages < 2) {
    size_t dataSize = bufferLength;
    char *data = static_cast<char *>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);

    return {data, dataSize};
  }

  vector<vector<pair<VImage, int>>> frameGroups(ceil(static_cast<float>(nPages) / groupSize));
  int *delays;
  in.get_array_int("delay", &delays, NULL);
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
    int group = i / groupSize;
    frameGroups[group].push_back({img_frame, delays[i]});
  }

  shuffle(frameGroups.begin(), frameGroups.end(), rng);

  vector<VImage> outFrames;
  outFrames.reserve(nPages);
  vector<int> outDelays;
  outDelays.reserve(nPages);
  for (const auto &group : frameGroups) {
    for (const auto &[image, delay] : group) {
      outFrames.push_back(image);
      outDelays.push_back(delay);
    }
  }

  VImage final = VImage::arrayjoin(outFrames, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  final.set("delay", outDelays);

  if (outType != "webp") outType = "gif";

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize,
                        outType == "gif" ? VImage::option()->set("dither", 0) : 0);

  return {buf, dataSize};
}
