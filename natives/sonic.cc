#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Sonic(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string text = obj.Get("text").As<Napi::String>().Utf8Value();

    Blob blob;

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