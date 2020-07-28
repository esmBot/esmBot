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
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
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

    optimizeImageLayers(&result, mid.begin(), mid.end());
    if (delay != 0) for_each(result.begin(), result.end(), animationDelayImage(delay));
    writeImages(result.begin(), result.end(), &blob);
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

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string overlay_path = info[1].As<Napi::String>().Utf8Value();
  string type = info[2].As<Napi::String>().Utf8Value();
  int delay = info[3].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[4].As<Napi::Function>();

  FlagWorker* flagWorker = new FlagWorker(cb, in_path, overlay_path, type, delay);
  flagWorker->Queue();
  return env.Undefined();
}