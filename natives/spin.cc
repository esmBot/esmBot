#ifdef MAGICK_ENABLED
#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

ArgumentMap Spin(const string& type, string& outType, const char* bufferdata, size_t bufferLength, [[maybe_unused]] ArgumentMap arguments, size_t& dataSize)
{
  int delay = GetArgumentWithFallback<int>(arguments, "delay", 0);

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

  if (type != "gif") {
    list<Image>::iterator it = coalesced.begin();
    for (int i = 0; i < 29; ++i) {
      coalesced.push_back(*it);
    }
  }

  int i = 0;
  for (Image &image : coalesced) {
    image.virtualPixelMethod(Magick::TransparentVirtualPixelMethod);
    image.scale(Geometry("256x256"));
    image.alphaChannel(Magick::SetAlphaChannel);
    double rotation[1] = {(double)360 * i / coalesced.size()};
    image.distort(Magick::ScaleRotateTranslateDistortion, 1, rotation);
    image.magick("GIF");
    mid.push_back(image);
    i++;
  }

  for_each(mid.begin(), mid.end(),
           gifDisposeMethodImage(Magick::BackgroundDispose));

  optimizeTransparency(mid.begin(), mid.end());
  if (delay != 0) {
    for_each(mid.begin(), mid.end(), animationDelayImage(delay));
  } else if (type != "gif") {
    for_each(mid.begin(), mid.end(), animationDelayImage(5));
  }

  for (Image &image : mid) {
    image.quantizeDitherMethod(FloydSteinbergDitherMethod);
    image.quantize();
  }

  writeImages(mid.begin(), mid.end(), &blob);

  outType = "gif";
  dataSize = blob.length();

  char *data = reinterpret_cast<char*>(malloc(dataSize));
  memcpy(data, blob.data(), dataSize);
  
  ArgumentMap output;
  output["buf"] = data;

  return output;
}
#endif
