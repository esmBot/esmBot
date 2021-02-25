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
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
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
      watermark_new.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(watermark_new);
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

Napi::Value Trump(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  TrumpWorker* blurWorker = new TrumpWorker(cb, path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}