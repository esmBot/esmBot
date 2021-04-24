#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Circle(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay =
      obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> blurred;
  readImages(&frames, path);
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Image &image : coalesced) {
    image.rotationalBlur(10);
    image.magick(type);
    blurred.push_back(image);
  }

  optimizeTransparency(blurred.begin(), blurred.end());

  if (type == "gif") {
    for (Image &image : blurred) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
      if (delay != 0) image.animationDelay(delay);
    }
  }

  writeImages(blurred.begin(), blurred.end(), &blob);

  Napi::Object result = Napi::Object::New(env);
  result.Set("data",
          Napi::Buffer<char>::Copy(env, (char *)blob.data(), blob.length()));
  result.Set("type", type);
  return result;
}