#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class TileWorker : public Napi::AsyncWorker {
 public:
  TileWorker(Napi::Function& callback, string in_path, string type, int delay)
      : Napi::AsyncWorker(callback), in_path(in_path), type(type), delay(delay) {}
  ~TileWorker() {}

  void Execute() {
    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    list<Image> result;
    readImages(&frames, in_path);
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      list<Image> duplicated;
      Image appended;
      list<Image> montage;
      Image frame;
      image.magick(type);
      for (int i = 0; i < 5; ++i) {
        duplicated.push_back(image);
      }
      appendImages(&appended, duplicated.begin(), duplicated.end());
      for (int i = 0; i < 5; ++i) {
        montage.push_back(appended);
      }
      appendImages(&frame, montage.begin(), montage.end(), true);
      frame.scale(Geometry("800x800>"));
      mid.push_back(frame);
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

Napi::Value Tile(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  string type = info[1].As<Napi::String>().Utf8Value();
  int delay = info[2].As<Napi::Number>().Int32Value();
  Napi::Function cb = info[3].As<Napi::Function>();

  TileWorker* flopWorker = new TileWorker(cb, in_path, type, delay);
  flopWorker->Queue();
  return env.Undefined();
}