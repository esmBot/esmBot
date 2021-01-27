#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class FreezeWorker : public Napi::AsyncWorker {
 public:
  FreezeWorker(Napi::Function& callback, string in_path, bool loop, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), loop(loop), type(type), delay(delay) {}
  ~FreezeWorker() {}

  void Execute() {
    list <Image> frames;
    readImages(&frames, in_path);

    for_each(frames.begin(), frames.end(), animationIterationsImage(loop ? 0 : 1));
    for_each(frames.begin(), frames.end(), magickImage(type));

    if (delay != 0) for_each(frames.begin(), frames.end(), animationDelayImage(delay));
    writeImages(frames.begin(), frames.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
  bool loop;
};

Napi::Value Freeze(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool loop = obj.Has("loop") ? obj.Get("loop").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  FreezeWorker* blurWorker = new FreezeWorker(cb, path, loop, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}