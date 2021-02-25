#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class BlurpleWorker : public Napi::AsyncWorker {
 public:
  BlurpleWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~BlurpleWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> blurpled;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.threshold(49151.25);
      image.levelColors("#7289DA", "white");
      image.magick(type);
      image.animationDelay(delay == 0 ? image.animationDelay() : delay);
      blurpled.push_back(image);
    }

    optimizeTransparency(blurpled.begin(), blurpled.end());

    if (type == "gif") {
      for (Image &image : blurpled) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
      }
    }
    

    writeImages(blurpled.begin(), blurpled.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
};

Napi::Value Blurple(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  BlurpleWorker* blurpleWorker = new BlurpleWorker(cb, path, type, delay);
  blurpleWorker->Queue();
  return env.Undefined();
}