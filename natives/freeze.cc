#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class FreezeWorker : public Napi::AsyncWorker {
 public:
  FreezeWorker(Napi::Function& callback, string in_path, bool loop, int frame, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), loop(loop), frame(frame), type(type), delay(delay) {}
  ~FreezeWorker() {}

  void Execute() {
    list <Image> frames;
    readImages(&frames, in_path);

    if (frame >= 0 && !loop) {
      size_t frameSize = frames.size();
      int framePos = clamp(frame, 0, (int)frameSize);
      frames.resize(framePos + 1);
    }
    for_each(frames.begin(), frames.end(), animationIterationsImage(loop ? 0 : 1));
    for_each(frames.begin(), frames.end(), magickImage(type));

    if (delay != 0) for_each(frames.begin(), frames.end(), animationDelayImage(delay));
    writeImages(frames.begin(), frames.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length()), Napi::String::From(Env(), type)});
  }

 private:
  string in_path, type;
  int frame, delay;
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
  int frame = obj.Has("frame") ? obj.Get("frame").As<Napi::Number>().Int32Value() : -1;

  FreezeWorker* freezeWorker = new FreezeWorker(cb, path, loop, frame, type, delay);
  freezeWorker->Queue();
  return env.Undefined();
}