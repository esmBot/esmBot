#include <napi.h>
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

  string text = info[0].As<Napi::String>().Utf8Value();
  Napi::Function cb = info[1].As<Napi::Function>();

  HomebrewWorker* explodeWorker = new HomebrewWorker(cb, text);
  explodeWorker->Queue();
  return env.Undefined();
}