#ifdef MAGICK_ENABLED
#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;

CmdOutput esmb::Image::Magik([[maybe_unused]] const string &type, string &outType, const char *bufferdata,
                             size_t bufferLength, [[maybe_unused]] esmb::ArgumentMap arguments,
                             [[maybe_unused]] bool *shouldKill) {
  Magick::Blob blob;

  list<Magick::Image> frames;
  list<Magick::Image> coalesced;
  list<Magick::Image> blurred;
  try {
    readImages(&frames, Magick::Blob(bufferdata, bufferLength));
  } catch (Magick::WarningCoder &warning) {
    cerr << "Coder Warning: " << warning.what() << endl;
  } catch (Magick::Warning &warning) {
    cerr << "Warning: " << warning.what() << endl;
  }
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Magick::Image &image : coalesced) {
    image.scale(Magick::Geometry("350x350"));
    image.liquidRescale(Magick::Geometry("175x175"));
    image.liquidRescale(Magick::Geometry("350x350"));
    image.magick(outType);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (outType == "gif") {
    for (Magick::Image &image : blurred) {
      image.quantizeDitherMethod(Magick::FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  size_t dataSize = blob.length();

  char *data = reinterpret_cast<char *>(malloc(dataSize));
  memcpy(data, blob.data(), dataSize);

  return {data, dataSize};
}
#endif
