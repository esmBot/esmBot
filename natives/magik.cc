#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class MagikWorker : public Napi::AsyncWorker {
 public:
  MagikWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~MagikWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> blurred;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.scale(Geometry("350x350"));
      image.liquidRescale(Geometry("175x175"));
      image.liquidRescale(Geometry("350x350"));
      image.magick(type);
      blurred.push_back(image);
    }

    optimizeTransparency(blurred.begin(), blurred.end());

    if (type == "gif") {
      for (Image &image : blurred) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
      }
    }

    writeImages(blurred.begin(), blurred.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
};

Napi::Value Magik(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;


  MagikWorker* explodeWorker = new MagikWorker(cb, path, type, delay);
  explodeWorker->Queue();
  return env.Undefined();
}