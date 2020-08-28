#include <napi.h>
#include <list>
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
  string in_path;
  Blob blob;
};

Napi::Value Jpeg(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();

  JpegWorker* explodeWorker = new JpegWorker(cb, path);
  explodeWorker->Queue();
  return env.Undefined();
}