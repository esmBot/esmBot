#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class FlagWorker : public Napi::AsyncWorker {
 public:
  FlagWorker(Napi::Function& callback, string in_path, string overlay_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), overlay_path(overlay_path), type(type), delay(delay) {}
  ~FlagWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    Image watermark;
    readImages(&frames, in_path);
    watermark.read(overlay_path);
    watermark.alphaChannel(Magick::SetAlphaChannel);
    watermark.evaluate(Magick::AlphaChannel, Magick::MultiplyEvaluateOperator, 0.5);
    string query(to_string(frames.front().baseColumns()) + "x" + to_string(frames.front().baseRows()) + "!");
    watermark.scale(Geometry(query));
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.composite(watermark, Magick::NorthGravity, Magick::OverCompositeOp);
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
  string in_path, overlay_path, type;
  int delay;
  Blob blob;
};

Napi::Value Flag(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string overlay = obj.Get("overlay").As<Napi::String>().Utf8Value();
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  FlagWorker* flagWorker = new FlagWorker(cb, path, overlay, type, delay);
  flagWorker->Queue();
  return env.Undefined();
}