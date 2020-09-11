#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class SpeedWorker : public Napi::AsyncWorker {
 public:
  SpeedWorker(Napi::Function& callback, string in_path, bool slow, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), slow(slow), type(type), delay(delay) {}
  ~SpeedWorker() {}

  void Execute() {
    list <Image> frames;
    readImages(&frames, in_path);
    
    int new_delay = slow ? delay * 2 : delay / 2;
    if (new_delay <= 1) {
      new_delay = delay;
      auto it = frames.begin();
      while(it != frames.end() && ++it != frames.end()) it = frames.erase(it);
    } else {
      for_each(frames.begin(), frames.end(), animationDelayImage(new_delay));
    }

    for_each(frames.begin(), frames.end(), magickImage(type));

    writeImages(frames.begin(), frames.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, amount;
  Blob blob;
  bool slow;
};

Napi::Value Speed(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool slow = obj.Has("slow") ? obj.Get("slow").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Get("delay").As<Napi::Number>().Int32Value();

  SpeedWorker* explodeWorker = new SpeedWorker(cb, path, slow, type, delay);
  explodeWorker->Queue();
  return env.Undefined();
}