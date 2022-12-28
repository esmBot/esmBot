#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>

#include "common.h"

using namespace std;
using namespace Magick;

char *Tile(string *type, char *BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t *DataSize) {
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
    list<Image> duplicated;
    Image appended;
    list<Image> montage;
    Image frame;
    image.magick(*type);
    for (int i = 0; i < 5; ++i) {
      duplicated.push_back(image);
    }
    appendImages(&appended, duplicated.begin(), duplicated.end());
    appended.repage();
    for (int i = 0; i < 5; ++i) {
      montage.push_back(appended);
    }
    appendImages(&frame, montage.begin(), montage.end(), true);
    frame.repage();
    frame.scale(Geometry("800x800>"));
    frame.animationDelay(image.animationDelay());
    mid.push_back(frame);
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