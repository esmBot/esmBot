#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class SonicWorker : public Napi::AsyncWorker {
 public:
  SonicWorker(Napi::Function& callback, string text)
      : Napi::AsyncWorker(callback), text(text) {}
  ~SonicWorker() {}

  void Execute() {
    Image image;
    Image text_image;
    text_image.backgroundColor("none");
    text_image.fontPointsize(72);
    text_image.textGravity(Magick::CenterGravity);
    text_image.font("Bitstream Vera Sans");
    text_image.read("pango:<span foreground='white'>" + text + "</span>");
    text_image.resize(Geometry(474, 332));
    text_image.extent(Geometry("1024x538-435-145"), Magick::CenterGravity);
    image.read("./assets/images/sonic.jpg");
    image.composite(text_image, Geometry("+160+10"), Magick::OverCompositeOp);
    image.magick("PNG");
    image.write(&blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string text, type;
  int delay;
  Blob blob;
};

Napi::Value Sonic(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string text = obj.Get("text").As<Napi::String>().Utf8Value();

  SonicWorker* explodeWorker = new SonicWorker(cb, text);
  explodeWorker->Queue();
  return env.Undefined();
}