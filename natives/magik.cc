#ifdef MAGICK_ENABLED
#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

ArgumentMap Magik([[maybe_unused]] const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                  [[maybe_unused]] ArgumentMap arguments, [[maybe_unused]] bool *shouldKill) {
  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> blurred;
  try {
    readImages(&frames, Blob(bufferdata, bufferLength));
  } catch (Magick::WarningCoder &warning) {
    cerr << "Coder Warning: " << warning.what() << endl;
  } catch (Magick::Warning &warning) {
    cerr << "Warning: " << warning.what() << endl;
  }
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Image &image : coalesced) {
    image.scale(Geometry("350x350"));
    image.liquidRescale(Geometry("175x175"));
    image.liquidRescale(Geometry("350x350"));
    image.magick(outType);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (outType == "gif") {
    for (Image &image : blurred) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  size_t dataSize = blob.length();

  char *data = reinterpret_cast<char *>(malloc(dataSize));
  memcpy(data, blob.data(), dataSize);

  ArgumentMap output;
  output["buf"] = data;
  output["size"] = dataSize;

  return output;
}
#endif
