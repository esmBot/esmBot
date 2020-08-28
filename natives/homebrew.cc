#include <napi.h>
#include <list>
#include <Magick++.h>

using namespace std;
using namespace Magick;

class HomebrewWorker : public Napi::AsyncWorker {
 public:
  HomebrewWorker(Napi::Function& callback, string text)
      : Napi::AsyncWorker(callback), text(text) {}
  ~HomebrewWorker() {}

  void Execute() {
    Image image;
    image.read("./assets/images/hbc.png");
    image.textGravity(Magick::CenterGravity);
    image.font("./assets/hbc.ttf");
    image.textKerning(-5);
    image.fillColor("white");
    image.fontPointsize(96);
    image.draw(DrawableText(0, 0, text));
    image.magick("PNG");
    image.write(&blob);
  }

  void OnOK() {
    Callback().Call({Env().Undefined(), Napi::Buffer<char>::Copy(Env(), (char *)blob.data(), blob.length())});
  }

 private:
  string text;
  Blob blob;
};

Napi::Value Homebrew(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string caption = obj.Get("caption").As<Napi::String>().Utf8Value();

  HomebrewWorker* explodeWorker = new HomebrewWorker(cb, caption);
  explodeWorker->Queue();
  return env.Undefined();
}