#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class BlurWorker : public Napi::AsyncWorker {
 public:
  BlurWorker(Napi::Function& callback, string in_path, bool sharp, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), sharp(sharp), type(type), delay(delay) {}
  ~BlurWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> result;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (sharp) {
      for_each(coalesced.begin(), coalesced.end(), sharpenImage(10, 3));
    } else {
      for_each(coalesced.begin(), coalesced.end(), blurImage(15));
    }

    for_each(coalesced.begin(), coalesced.end(), magickImage(type));

    optimizeImageLayers(&result, coalesced.begin(), coalesced.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
  bool sharp;
};

Napi::Value Blur(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool sharp = obj.Get("sharp").As<Napi::Boolean>().Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Get("delay").As<Napi::Number>().Int32Value();

  BlurWorker* blurWorker = new BlurWorker(cb, path, sharp, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}