#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class ResizeWorker : public Napi::AsyncWorker {
 public:
  ResizeWorker(Napi::Function& callback, string in_path, bool stretch, bool wide, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), stretch(stretch), wide(wide), type(type), delay(delay) {}
  ~ResizeWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> blurred;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      if (stretch) {
        image.resize(Geometry("512x512!"));
      } else if (wide) {
        image.resize(Geometry(to_string((image.baseColumns() * 19) / 2) + "x" + to_string(image.baseRows() / 2) + "!"));
      } else {
        image.scale(Geometry("10%"));
        image.scale(Geometry("1000%"));
      }
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
  int delay, amount;
  Blob blob;
  bool stretch, wide;
};

Napi::Value Resize(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool stretch = obj.Has("stretch") ? obj.Get("stretch").As<Napi::Boolean>().Value() : false;
  bool wide = obj.Has("wide") ? obj.Get("wide").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  ResizeWorker* explodeWorker = new ResizeWorker(cb, path, stretch, wide, type, delay);
  explodeWorker->Queue();
  return env.Undefined();
}