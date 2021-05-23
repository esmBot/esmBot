#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Homebrew(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();

    Blob blob;

    Image image;
    image.read("./assets/images/hbc.png");
    image.textGravity(Magick::CenterGravity);
    image.font("./assets/hbc.ttf");
    image.textKerning(-5);
    image.fillColor("white");
    image.fontPointsize(96);
    image.draw(DrawableText(0, 0, caption));
    image.magick("PNG");
    image.write(&blob);

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                blob.length()));
    result.Set("type", "png");
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}