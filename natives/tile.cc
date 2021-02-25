#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class TileWorker : public Napi::AsyncWorker {
 public:
  TileWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~TileWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      list <Image> duplicated;
      Image appended;
      list <Image> montage;
      Image frame;
      image.magick(type);
      for (int i = 0; i < 5; ++i) {
        duplicated.push_back(image);
      }
      appendImages(&appended, duplicated.begin(), duplicated.end());
      appended.repage();
      for (int i = 0; i < 5; ++i) {
        montage.push_back(appended);
      }
      appendImages(&frame, montage.begin(), montage.end(), true);
      frame.repage();
      frame.scale(Geometry("800x800>"));
      frame.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(frame);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
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

Napi::Value Tile(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  TileWorker* flopWorker = new TileWorker(cb, path, type, delay);
  flopWorker->Queue();
  return env.Undefined();
}