#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class WallWorker : public Napi::AsyncWorker {
 public:
  WallWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~WallWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.resize(Geometry("128x128"));
      image.virtualPixelMethod(Magick::TileVirtualPixelMethod);
      image.matteColor("none");
      image.backgroundColor("none");
      image.scale(Geometry("512x512"));
      double arguments[16] = {0, 0, 57, 42, 0, 128, 63, 130, 128, 0, 140, 60, 128, 128, 140, 140};
      image.distort(Magick::PerspectiveDistortion, 16, arguments);
      image.scale(Geometry("800x800>"));
      image.magick(type);
      mid.push_back(image);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
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
  int delay;
  Blob blob;
};

Napi::Value Wall(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  WallWorker* flopWorker = new WallWorker(cb, path, type, delay);
  flopWorker->Queue();
  return env.Undefined();
}