#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class ReverseWorker : public Napi::AsyncWorker {
 public:
  ReverseWorker(Napi::Function& callback, string in_path, bool soos, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), soos(soos), delay(delay) {}
  ~ReverseWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (soos) {
      list<Image> copy = coalesced;
      copy.reverse();
      coalesced.insert(coalesced.end(), copy.begin(), copy.end());
    } else {
      coalesced.reverse();
    }

    for_each(coalesced.begin(), coalesced.end(), magickImage("GIF"));

    optimizeTransparency(coalesced.begin(), coalesced.end());

    if (type == "gif") {
      for (Image &image : coalesced) {
        image.quantizeDither(false);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
      }
    }

    writeImages(coalesced.begin(), coalesced.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, amount;
  Blob blob;
  bool soos;
};

Napi::Value Reverse(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool soos = obj.Has("soos") ? obj.Get("soos").As<Napi::Boolean>().Value() : false;
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  ReverseWorker* explodeWorker = new ReverseWorker(cb, path, soos, delay);
  explodeWorker->Queue();
  return env.Undefined();
}