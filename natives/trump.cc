#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class TrumpWorker : public Napi::AsyncWorker {
 public:
  TrumpWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~TrumpWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
    Image watermark;
    readImages(&frames, in_path);
    watermark.read("./assets/images/trump.png");
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image watermark_new = watermark;
      image.virtualPixelMethod(Magick::TransparentVirtualPixelMethod);
      image.backgroundColor("none");
      image.scale(Geometry("365x179!"));
      double arguments[16] = {0, 0, 207, 268, 365, 0, 548, 271, 365, 179, 558, 450, 0, 179, 193, 450};
      image.distort(Magick::PerspectiveDistortion, 16, arguments, true);
      image.extent(Geometry("800x450"), Magick::CenterGravity);
      watermark_new.composite(image, Geometry("-25+134"), Magick::DstOverCompositeOp);
      watermark_new.magick(type);
      mid.push_back(watermark_new);
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
  int delay;
  Blob blob;
};

Napi::Value Trump(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string type = info[1].As<Napi::String>().Utf8Value();
  int delay = info[2].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[3].As<Napi::Function>();

  TrumpWorker* blurWorker = new TrumpWorker(cb, in_path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}