#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

char *Scott(string *type, char *BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t *DataSize) {
  string basePath = GetArgument<string>(Arguments, "basePath");

  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> mid;
  Image watermark;
  try {
    readImages(&frames, Blob(BufferData, BufferLength));
  } catch (Magick::WarningCoder &warning) {
    cerr << "Coder Warning: " << warning.what() << endl;
  } catch (Magick::Warning &warning) {
    cerr << "Warning: " << warning.what() << endl;
  }
  watermark.read(basePath + "assets/images/scott.png");
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Image &image : coalesced) {
    Image watermark_new = watermark;
    image.virtualPixelMethod(Magick::TransparentVirtualPixelMethod);
    image.backgroundColor("none");
    image.scale(Geometry("415x234!"));
    double arguments[16] = {0,   0,   129, 187, 415, 0,   517, 182,
                            415, 234, 517, 465, 0,   234, 132, 418};
    image.distort(Magick::PerspectiveDistortion, 16, arguments, true);
    image.extent(Geometry("864x481"), Magick::CenterGravity);
    watermark_new.composite(image, Geometry("-110+83"),
                            Magick::OverCompositeOp);
    watermark_new.magick(*type);
    watermark_new.animationDelay(image.animationDelay());
    mid.push_back(watermark_new);
  }

  optimizeTransparency(mid.begin(), mid.end());

  if (*type == "gif") {
    for (Image &image : mid) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(mid.begin(), mid.end(), &blob);

  *DataSize = blob.length();

  char *data = (char *)malloc(*DataSize);
  memcpy(data, blob.data(), *DataSize);
  return data;
}