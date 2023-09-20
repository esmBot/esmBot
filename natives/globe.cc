#include <vips/vips8>

#include "common.h"

using namespace std;
using namespace vips;

ArgumentMap Globe(string type, string *outType, char *BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t *DataSize) {
  string basePath = GetArgument<string>(Arguments, "basePath");

  VImage in =
      VImage::new_from_buffer(
          BufferData, BufferLength, "",
          type == "gif" ? VImage::option()->set("n", -1)->set("access", "sequential")
                         : 0)
          .colourspace(VIPS_INTERPRETATION_sRGB);
  if (!in.has_alpha()) in = in.bandjoin(255);

  int width = in.width();
  int pageHeight = vips_image_get_page_height(in.get_image());
  int nPages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 30;

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
        type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
    VImage resized = img_frame.resize(
        size / (double)width,
        VImage::option()->set("vscale", size / (double)pageHeight));
    VImage rolled = img_frame.wrap(
        VImage::option()->set("x", width * i / nPages)->set("y", 0));
    VImage extracted = rolled.extract_band(0, VImage::option()->set("n", 3));
    VImage mapped = extracted.mapim(distort);
    VImage composited = mapped * diffuse + specular;
    VImage frame = composited.bandjoin(diffuse > 0.0);
    img.push_back(frame);
  }
  VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
  final.set(VIPS_META_PAGE_HEIGHT, size);
  if (type != "gif") {
    vector<int> delay(30, 50);
    final.set("delay", delay);
  }

  void *buf;
  final.write_to_buffer(".gif", &buf, DataSize);

  *outType = "gif";

  ArgumentMap output;
  output["buf"] = (char *)buf;

  return output;
}