#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class GlobeWorker : public Napi::AsyncWorker {
 public:
  GlobeWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~GlobeWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    Image distort;
    Image overlay;
    readImages(&frames, in_path);
    distort.read("./assets/images/spheremap.png");
    overlay.read("./assets/images/sphere_overlay.png");
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (type != "GIF") {
      list <Image>::iterator it = coalesced.begin();
      for (int i = 0; i < 29; ++i) {
        coalesced.push_back(*it);
      }
    }

    int i = 0;
    for (Image &image : coalesced) {
      image.scale(Geometry("500x500!"));
      image.alphaChannel(Magick::SetAlphaChannel);
      size_t width = image.columns();
      image.roll(Geometry("+" + to_string(width * i / coalesced.size())));
      image.composite(overlay, Magick::CenterGravity, Magick::HardLightCompositeOp);
      image.composite(distort, Magick::CenterGravity, Magick::DistortCompositeOp);
      image.magick("GIF");
      mid.push_back(image);
      i++;
    }

    optimizeTransparency(mid.begin(), mid.end());
    if (delay != 0) {
      for_each(mid.begin(), mid.end(), animationDelayImage(delay));
    } else if (type != "GIF") {
      for_each(mid.begin(), mid.end(), animationDelayImage(5));
    }

    for (Image &image : mid) {
      image.quantizeDitherMethod(FloydSteinbergDitherMethod);
      image.quantize();
    }

    writeImages(mid.begin(), mid.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
};

Napi::Value Globe(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  GlobeWorker* blurWorker = new GlobeWorker(cb, path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}