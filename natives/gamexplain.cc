#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Gamexplain(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay =
      obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  Blob blob;

  list<Image> frames;
  list<Image> coalesced;
  list<Image> mid;
  Image watermark;
  readImages(&frames, path);
  watermark.read("./assets/images/gamexplain.png");
  coalesceImages(&coalesced, frames.begin(), frames.end());

  for (Image &image : coalesced) {
    image.backgroundColor("white");
    image.scale(Geometry("1181x571!"));
    image.extent(Geometry("1200x675-10-92"));
    image.composite(watermark, Geometry("+0+0"), Magick::OverCompositeOp);
    image.magick(type);
    mid.push_back(image);
  }

  optimizeTransparency(mid.begin(), mid.end());

  if (type == "gif") {
    for (Image &image : mid) {
      image.quantizeDither(false);
      image.quantize();
      if (delay != 0) image.animationDelay(delay);
    }
  }

  writeImages(mid.begin(), mid.end(), &blob);

  Napi::Object result = Napi::Object::New(env);
  result.Set("data",
          Napi::Buffer<char>::Copy(env, (char *)blob.data(), blob.length()));
  result.Set("type", type);
  return result;
}