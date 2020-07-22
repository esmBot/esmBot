#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class ReverseWorker : public Napi::AsyncWorker {
 public:
  ReverseWorker(Napi::Function& callback, string in_path, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), delay(delay) {}
  ~ReverseWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> result;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    coalesced.reverse();

    optimizeImageLayers(&result, coalesced.begin(), coalesced.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, wordlength, i, n, amount;
  size_t bytes, type_size;
  Blob blob;
};

Napi::Value Reverse(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  int delay = info[1].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[2].As<Napi::Function>();

  ReverseWorker* explodeWorker = new ReverseWorker(cb, in_path, delay);
  explodeWorker->Queue();
  return env.Undefined();
}