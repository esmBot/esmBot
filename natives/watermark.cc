#include <napi.h>
#include <list>
#include <iostream>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class WatermarkWorker : public Napi::AsyncWorker {
 public:
  WatermarkWorker(Napi::Function& callback, string in_path, string water_path, int gravity, string type, int delay, bool resize, bool append, bool mc)
      : Napi::AsyncWorker(callback), in_path(in_path), water_path(water_path), gravity(gravity), type(type), delay(delay), resize(resize), append(append), mc(mc) {}
  ~WatermarkWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    Image watermark;
    readImages(&frames, in_path);
    watermark.read(water_path);
    if (resize && append) {
      string query(to_string(frames.front().baseColumns()) + "x");
      watermark.scale(Geometry(query));
    } else if (resize) {
      string query("x" + to_string(frames.front().baseRows()));
      watermark.scale(Geometry(query));
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image final;
      if (append) {
        list <Image> to_append;
        to_append.push_back(image);
        to_append.push_back(watermark);
        appendImages(&final, to_append.begin(), to_append.end(), true);
        final.repage();
      } else if (mc) {
        image.backgroundColor("white");
        image.extent(Geometry(image.columns(), image.rows() + 15));
        image.composite(watermark, Magick::GravityType(gravity), Magick::OverCompositeOp);
        final = image;
      } else {
        image.composite(watermark, Magick::GravityType(gravity), Magick::OverCompositeOp);
        final = image;
      }
      image.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
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
  string in_path, water_path, type;
  int delay, gravity;
  Blob blob;
  bool resize, append, mc;
};

Napi::Value Watermark(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  string water = obj.Get("water").As<Napi::String>().Utf8Value();
  int gravity = obj.Get("gravity").As<Napi::Number>().Int32Value();
  bool resize = obj.Has("resize") ? obj.Get("resize").As<Napi::Boolean>().Value() : false;
  bool append = obj.Has("append") ? obj.Get("append").As<Napi::Boolean>().Value() : false;
  bool mc = obj.Has("mc") ? obj.Get("mc").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  WatermarkWorker* watermarkWorker = new WatermarkWorker(cb, path, water, gravity, type, delay, resize, append, mc);
  watermarkWorker->Queue();
  return env.Undefined();
}