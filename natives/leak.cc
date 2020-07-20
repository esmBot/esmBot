#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class LeakWorker : public Napi::AsyncWorker {
 public:
  LeakWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~LeakWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image watermark;
    readImages(&frames, in_path);
    watermark.read("./assets/images/leak.png");
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      image.backgroundColor("white");
      image.scale(Geometry("640x360!"));
      image.rotate(15);
      image.extent(Geometry("1280x720-700+100"));
      image.composite(watermark, Geometry("+0+0"), Magick::OverCompositeOp);
      image.magick(type);
      mid.push_back(image);
    }

    if (delay != 0) for_each(mid.begin(), mid.end(), animationDelayImage(delay));
    writeImages(mid.begin(), mid.end(), &blob);
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

Napi::Value Leak(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string type = info[1].As<Napi::String>().Utf8Value();
  int delay = info[2].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[3].As<Napi::Function>();

  LeakWorker* blurWorker = new LeakWorker(cb, in_path, type, delay);
  blurWorker->Queue();
  return env.Undefined();
}