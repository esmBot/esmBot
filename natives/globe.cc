#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Globe(const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                  ArgumentMap arguments, bool *shouldKill) {
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in = VImage::new_from_buffer(bufferdata, bufferLength, "", GetInputOptions(type, true, true))
                .colourspace(VIPS_INTERPRETATION_sRGB);
  if (in.has_alpha()) in = in.flatten();

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  bool multiPage = true;

  try {
    in = NormalizeVips(in, &width, &pageHeight, nPages);
  } catch (int e) {
    if (e == -1) {
      ArgumentMap output;
      output["buf"] = "";
      outType = "frames";
      return output;
    }
  }

  if (nPages == 1) {
    multiPage = false;
    nPages = 30;
  }

  int size = min(width, pageHeight);

  string specdiffPath = basePath + "assets/images/globespecdiff.png";
  VImage loaded = VImage::new_from_file(specdiffPath.c_str())
                    .resize(size / 500.0, VImage::option()->set("kernel", VIPS_KERNEL_LINEAR));
  VImage diffuse = loaded[1] / 255;
  VImage specular = loaded[0];

  string distortPath = basePath + "assets/images/spheremap.png";
  VImage distort = ((VImage::new_from_file(distortPath.c_str())
                       .resize(size / 500.0, VImage::option()->set("kernel", VIPS_KERNEL_LINEAR)) /
                     65535) *
                    size)
                     .cast(VIPS_FORMAT_USHORT)
                     .copy_memory();

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame = multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage mapped = img_frame.wrap(VImage::option()->set("x", width * i / nPages)->set("y", 0)).mapim(distort);
    VImage frame = (mapped * diffuse + specular).cast(VIPS_FORMAT_UCHAR).bandjoin(diffuse > 0.0);
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, size);
  if (!multiPage) {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  SetupTimeoutCallback(final, shouldKill);

  char *buf;
  size_t dataSize = 0;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void **>(&buf), &dataSize);

  if (outType != "webp") outType = "gif";

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}
