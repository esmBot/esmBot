#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class FreezeWorker : public Napi::AsyncWorker {
 public:
  FreezeWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~FreezeWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> result;
    readImages(&frames, in_path);

    for_each(frames.begin(), frames.end(), animationIterationsImage(1)); 

    optimizeImageLayers(&result, frames.begin(), frames.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, wordlength, i, n;
  size_t bytes, type_size;
  Blob blob;
};

Napi::Value Freeze(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string type = info[1].As<Napi::String>().Utf8Value();
  int delay = info[2].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[3].As<Napi::Function>();

  FreezeWorker* blurWorker = new FreezeWorker(cb, in_path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}