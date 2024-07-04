#include <algorithm>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Reverse([[maybe_unused]] const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  bool soos = GetArgumentWithFallback<bool>(arguments, "soos", false);

  VOption *options =
      VImage::option()->set("access", "sequential")->set("n", -1);

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", options)
                  .colourspace(VIPS_INTERPRETATION_sRGB);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

  // this command is useless with single-page images
  if (nPages < 2) {
    dataSize = bufferLength;
    char *data = reinterpret_cast<char*>(malloc(bufferLength));
    memcpy(data, bufferdata, bufferLength);

    ArgumentMap output;
    output["buf"] = data;

    return output;
  }

  vector<VImage> split;
  // todo: find a better way of getting individual frames (or at least getting
  // the frames in reverse order)
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = in.crop(0, i * pageHeight, width, pageHeight);
    split.push_back(img_frame);
  }

  vector<int> delays = in.get_array_int("delay");
  if (soos) {
    vector<VImage> copy = split;
    vector<int> copy2 = delays;
    reverse(copy.begin(), copy.end());
    reverse(copy2.begin(), copy2.end());
    copy.pop_back();
    copy2.pop_back();
    copy.erase(copy.begin());
    copy2.erase(copy2.begin());
    split.insert(split.end(), copy.begin(), copy.end());
    delays.insert(delays.end(), copy2.begin(), copy2.end());
  } else {
    reverse(split.begin(), split.end());
    reverse(delays.begin(), delays.end());
  }

  VImage final = VImage::arrayjoin(split, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
  final.set("delay", delays);

  char *buf;
  final.write_to_buffer(".gif", reinterpret_cast<void**>(&buf), &dataSize,
                        VImage::option()->set("dither", 0));

  outType = "gif";

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
