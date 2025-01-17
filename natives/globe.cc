#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Globe(const string& type, string& outType, const char* bufferdata, size_t bufferLength, ArgumentMap arguments, size_t& dataSize)
{
  string basePath = GetArgument<string>(arguments, "basePath");

  VImage in =
      VImage::new_from_buffer(
          bufferdata, bufferLength, "",
          GetInputOptions(type, true, true))
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "avif" ? 1 : vips_image_get_n_pages(in.get_image());
  bool multiPage = true;
  if (nPages == 1) {
    multiPage = false;
    nPages = 30;
  }

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

  double size = min(width, pageHeight);

  string diffPath = basePath + "assets/images/globediffuse.png";
  VImage diffuse = VImage::new_from_file(diffPath.c_str())
                       .resize(size / 500.0, VImage::option()->set(
                                                 "kernel", VIPS_KERNEL_CUBIC)) /
                   255;

  string specPath = basePath + "assets/images/globespec.png";
  VImage specular = VImage::new_from_file(specPath.c_str())
                        .resize(size / 500.0, VImage::option()->set(
                                                  "kernel", VIPS_KERNEL_CUBIC));

  string distortPath = basePath + "assets/images/spheremap.png";
  VImage distort =
      (VImage::new_from_file(distortPath.c_str())
           .resize(size / 500.0,
                   VImage::option()->set("kernel", VIPS_KERNEL_CUBIC)) /
       65535) *
      size;

  vector<VImage> img;
  for (int i = 0; i < nPages; i++) {
    VImage img_frame =
        multiPage ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage mapped = img_frame
        .wrap(VImage::option()->set("x", width * i / nPages)->set("y", 0))
        .extract_band(0, VImage::option()->set("n", 3))
        .mapim(distort);
    VImage frame = (mapped * diffuse + specular).bandjoin(diffuse > 0.0);
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, size);
  if (!multiPage) {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  char *buf;
  final.write_to_buffer(outType == "webp" ? ".webp" : ".gif", reinterpret_cast<void**>(&buf), &dataSize);

  if (outType != "webp") outType = "gif";

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}
