#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class MirrorWorker : public Napi::AsyncWorker {
 public:
  MirrorWorker(Napi::Function& callback, string in_path, bool vertical, bool first, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), vertical(vertical), first(first), type(type), delay(delay) {}
  ~MirrorWorker() {}

  void Execute() {
    list <Image> frames;
    list <Image> coalesced;
    list <Image> mid;
    MagickCore::GravityType gravity;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (vertical && first) {
      gravity = Magick::NorthGravity;
    } else if (!vertical && first) {
      gravity = Magick::WestGravity;
    } else if (vertical && !first) {
      gravity = Magick::SouthGravity;
    } else {
      gravity = Magick::EastGravity;
    }

    for (Image &image : coalesced) {
      list <Image> mirrored;
      Image final;
      image.extent(Geometry(to_string(vertical ? image.baseColumns() : image.baseColumns() / 2) + "x" + to_string(vertical ? image.baseRows() / 2 : image.baseRows())), gravity);
      mirrored.push_back(image);
      Image mirror = image;
      if (vertical) {
        mirror.flip();
      } else {
        mirror.flop();
      }
      if (first) {
        mirrored.push_back(mirror);
      } else {
        mirrored.push_front(mirror);
      }
      appendImages(&final, mirrored.begin(), mirrored.end(), vertical);
      final.repage();
      final.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
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
  bool vertical, first;
  Blob blob;
};

Napi::Value Mirror(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();
  bool vertical = obj.Has("vertical") ? obj.Get("vertical").As<Napi::Boolean>().Value() : false;
  bool first = obj.Has("first") ? obj.Get("first").As<Napi::Boolean>().Value() : false;
  string type = obj.Get("type").As<Napi::String>().Utf8Value();
  int delay = obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

  MirrorWorker* mirrorWorker = new MirrorWorker(cb, path, vertical, first, type, delay);
  mirrorWorker->Queue();
  return env.Undefined();
}