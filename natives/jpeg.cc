#include <napi.h>
#include <list>
#include <iostream>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class JpegWorker : public Napi::AsyncWorker {
 public:
  JpegWorker(Napi::Function& callback, string in_path)
      : Napi::AsyncWorker(callback), in_path(in_path) {}
  ~JpegWorker() {}

  void Execute() {
    Image image;
    image.read(in_path);
    image.quality(1);
    image.magick("JPEG");
    image.write(&blob);
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

Napi::Value Jpeg(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  string in_path = info[0].As<Napi::String>().Utf8Value();
  Napi::Function cb = info[1].As<Napi::Function>();

  JpegWorker* explodeWorker = new JpegWorker(cb, in_path);
  explodeWorker->Queue();
  return env.Undefined();
}