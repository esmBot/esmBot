#ifdef MAGICK_ENABLED
#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

ArgumentMap Wall([[maybe_unused]] const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                 [[maybe_unused]] ArgumentMap arguments, [[maybe_unused]] bool *shouldKill) {
  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> mid;
  try {
    readImages(&frames, Blob(bufferdata, bufferLength));
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
    double arguments[16] = {0, 0, 57, 42, 0, 128, 63, 130, 128, 0, 140, 60, 128, 128, 140, 140};
    image.distort(Magick::PerspectiveDistortion, 16, arguments);
    image.scale(Geometry("800x800>"));
    image.magick(outType);
    mid.push_back(image);
  }

  optimizeTransparency(mid.begin(), mid.end());

  if (outType == "gif") {
    for (Image &image : mid) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(mid.begin(), mid.end(), &blob);

  size_t dataSize = blob.length();

  char *data = reinterpret_cast<char *>(malloc(dataSize));
  memcpy(data, blob.data(), dataSize);

  ArgumentMap output;
  output["buf"] = data;
  output["size"] = dataSize;

  return output;
}
#endif
