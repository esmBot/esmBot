#include <Magick++.h>

#include <cstring>
#include <iostream>
#include <list>
#include <map>
#include <string>

#include "common.h"

using namespace std;
using namespace Magick;

ArgumentMap Circle(string type, string *outType, char *BufferData,
             size_t BufferLength, [[maybe_unused]] ArgumentMap Arguments,
             size_t *DataSize) {
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
    image.rotationalBlur(10);
    image.magick(*outType);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (*outType == "gif") {
    for (Image &image : blurred) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  *DataSize = blob.length();

  // workaround because the data is tied to the blob
  char *data = (char *)malloc(*DataSize);
  memcpy(data, blob.data(), *DataSize);
  
  ArgumentMap output;
  output["buf"] = data;

  return output;
}