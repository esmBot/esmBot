#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

char *Magik(string *type, char *BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t *DataSize) {
  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> blurred;
  try {
    readImages(&frames, Blob(BufferData, BufferLength));
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
    image.magick(*type);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (*type == "gif") {
    for (Image &image : blurred) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  *DataSize = blob.length();

  char *data = (char *)malloc(*DataSize);
  memcpy(data, blob.data(), *DataSize);
  return data;
}