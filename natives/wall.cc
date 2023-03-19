#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

ArgumentMap Wall(string type, string *outType, char *BufferData, size_t BufferLength,
           [[maybe_unused]] ArgumentMap Arguments, size_t *DataSize) {
  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> mid;
  try {
    readImages(&frames, Blob(BufferData, BufferLength));
  } catch (Magick::WarningCoder &warning) {
    cerr << "Coder Warning: " << warning.what() << endl;
  } catch (Magick::Warning &warning) {
    cerr << "Warning: " << warning.what() << endl;
  }
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Image &image : coalesced) {
    image.resize(Geometry("128x128"));
    image.virtualPixelMethod(Magick::TileVirtualPixelMethod);
    image.matteColor("none");
    image.backgroundColor("none");
    image.scale(Geometry("512x512"));
    double arguments[16] = {0,   0, 57,  42, 0,   128, 63,  130,
                            128, 0, 140, 60, 128, 128, 140, 140};
    image.distort(Magick::PerspectiveDistortion, 16, arguments);
    image.scale(Geometry("800x800>"));
    image.magick(*outType);
    mid.push_back(image);
  }

  optimizeTransparency(mid.begin(), mid.end());

  if (*outType == "gif") {
    for (Image &image : mid) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(mid.begin(), mid.end(), &blob);

  *DataSize = blob.length();

  char *data = (char *)malloc(*DataSize);
  memcpy(data, blob.data(), *DataSize);

  ArgumentMap output;
  output["buf"] = data;

  return output;
}