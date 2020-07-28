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
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
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
      list<Image> mirrored;
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
      final.magick(type);
      mid.push_back(final);
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
  bool vertical, first;
  Blob blob;
};

Napi::Value Mirror(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  bool vertical = info[1].As<Napi::Boolean>().Value();
  bool first = info[2].As<Napi::Boolean>().Value();
  string type = info[3].As<Napi::String>().Utf8Value();
  int delay = info[4].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[5].As<Napi::Function>();

  MirrorWorker* mirrorWorker = new MirrorWorker(cb, in_path, vertical, first, type, delay);
  mirrorWorker->Queue();
  return env.Undefined();
}