#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class CropWorker : public Napi::AsyncWorker {
 public:
  CropWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~CropWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.extent(Geometry(to_string(image.columns() / image.rows() >= 1 ? image.rows() : image.columns()) + "x"), Magick::CenterGravity);
      image.extent(Geometry("x" + to_string(image.columns() / image.rows() <= 1 ? image.columns() : image.rows())), Magick::CenterGravity);
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
  int delay;
  Blob blob;
};

Napi::Value Crop(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  CropWorker* blurWorker = new CropWorker(cb, path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}