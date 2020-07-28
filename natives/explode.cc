#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class ExplodeWorker : public Napi::AsyncWorker {
 public:
  ExplodeWorker(Napi::Function& callback, string in_path, int amount, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), amount(amount), type(type), delay(delay) {}
  ~ExplodeWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> blurred;
    list<Image> result;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.implode(amount);
      image.magick(type);
      blurred.push_back(image);
    }

    optimizeImageLayers(&result, blurred.begin(), blurred.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, amount;
  Blob blob;
};

Napi::Value Explode(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  int amount = info[1].As<Napi::Number>().Int32Value();
  string type = info[2].As<Napi::String>().Utf8Value();
  int delay = info[3].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[4].As<Napi::Function>();

  ExplodeWorker* explodeWorker = new ExplodeWorker(cb, in_path, amount, type, delay);
  explodeWorker->Queue();
  return env.Undefined();
}