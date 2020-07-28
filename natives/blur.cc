#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class BlurWorker : public Napi::AsyncWorker {
 public:
  BlurWorker(Napi::Function& callback, string in_path, bool sharp, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), sharp(sharp), type(type), delay(delay) {}
  ~BlurWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> blurred;
    list<Image> result;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      if (sharp) {
        image.sharpen(10, 3);
      } else {
        image.blur(15);
      }
      image.magick(type);
      blurred.push_back(image);
    }

    optimizeImageLayers(&result, blurred.begin(), blurred.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay;
  Blob blob;
  bool sharp;
};

Napi::Value Blur(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  bool sharp = info[1].As<Napi::Boolean>().Value();
  string type = info[2].As<Napi::String>().Utf8Value();
  int delay = info[3].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[4].As<Napi::Function>();

  BlurWorker* blurWorker = new BlurWorker(cb, in_path, sharp, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}