#include <algorithm>
#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Reverse(string type, string *outType, char *BufferData,
              size_t BufferLength, ArgumentMap Arguments, size_t *DataSize) {
  bool soos = GetArgumentWithFallback<bool>(Arguments, "soos", false);

  VOption *options =
      VImage::option()->set("access", "sequential")->set("n", -1);

  VImage in = VImage::new_from_buffer(BufferData, BufferLength, "", options)
                  .colourspace(VIPS_INTERPRETATION_sRGB);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = vips_image_get_n_pages(in.get_image());

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

  void *buf;
  final.write_to_buffer(".gif", &buf, DataSize,
                        VImage::option()->set("dither", 0));

  *outType = "gif";

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}