#include "common.h"

#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>
#include <map>
#include <string>

using namespace std;
using namespace Magick;

char *Explode(string type, char *BufferData, size_t BufferLength,
              map<string, ARG_TYPES> Arguments, size_t *DataSize) {

  int amount = MAP_GET(Arguments, "amount", int);
  int delay = MAP_GET_FALLBACK(Arguments, "delay", int, 0);

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
    image.implode(amount);
    image.magick(type);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (type == "gif") {
    for (Image &image : blurred) {
      image.quantizeDither(false);
      image.quantize();
      if (delay != 0) image.animationDelay(delay);
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  *DataSize = blob.length();

  // workaround because the data is tied to the blob
  char *data = (char *)malloc(*DataSize);
  memcpy(data, blob.data(), *DataSize);
  return data;
}