#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class NineGagWorker : public Napi::AsyncWorker {
 public:
  NineGagWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~NineGagWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
    Image watermark;
    readImages(&frames, in_path);
    watermark.read("./assets/images/9gag.png");
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.composite(watermark, Magick::EastGravity, Magick::OverCompositeOp);
      image.magick(type);
      mid.push_back(image);
    }

    optimizeImageLayers(&result, mid.begin(), mid.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string in_path, type;
  int delay, wordlength, i, n;
  size_t bytes, type_size;
  Blob blob;
};

Napi::Value NineGag(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string type = info[1].As<Napi::String>().Utf8Value();
  int delay = info[2].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[3].As<Napi::Function>();

  NineGagWorker* ninegagWorker = new NineGagWorker(cb, in_path, type, delay);
  ninegagWorker->Queue();
  return env.Undefined();
}