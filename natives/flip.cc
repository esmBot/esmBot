#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class FlipWorker : public Napi::AsyncWorker {
 public:
  FlipWorker(Napi::Function& callback, string in_path, bool flop, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), flop(flop), type(type), delay(delay) {}
  ~FlipWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      flop ? image.flop() : image.flip();
      image.magick(type);
      mid.push_back(image);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
      }
    }

    writeImages(mid.begin(), mid.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  bool flop;
  int delay;
  Blob blob;
};

Napi::Value Flip(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool flop = obj.Has("flop") ? obj.Get("flop").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  FlipWorker* flipWorker = new FlipWorker(cb, path, flop, type, delay);
  flipWorker->Queue();
  return env.Undefined();
}