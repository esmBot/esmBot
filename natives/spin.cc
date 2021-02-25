#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class SpinWorker : public Napi::AsyncWorker {
 public:
  SpinWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~SpinWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (type != "GIF") {
      list <Image>::iterator it = coalesced.begin();
      for (int i = 0; i < 29; ++i) {
        coalesced.push_back(*it);
      }
    }

    int i = 0;
    for (Image &image : coalesced) {
      image.scale(Geometry("256x256"));
      image.alphaChannel(Magick::SetAlphaChannel);
      double rotation[1] = {360 * i / coalesced.size()};
      image.distort(Magick::ScaleRotateTranslateDistortion, 1, rotation);
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

Napi::Value Spin(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  SpinWorker* blurWorker = new SpinWorker(cb, path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}