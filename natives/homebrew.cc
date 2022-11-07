#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Homebrew(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    string assetPath = basePath + "assets/images/hbc.png";
    VImage bg = VImage::new_from_file(assetPath.c_str());

    VImage text = VImage::text(
        ".", VImage::option()->set(
                 "fontfile", (basePath + "assets/fonts/hbc.ttf").c_str()));
    text = VImage::text(
        ("<span letter_spacing=\"-5120\" color=\"white\">" + caption +
         "</span>")
            .c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", "PF Square Sans Pro, Twemoji Color Font 96")
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str()));

    VImage out = bg.composite2(text, VIPS_BLEND_MODE_OVER,
                               VImage::option()
                                   ->set("x", 400 - (text.width() / 2))
                                   ->set("y", 300 - (text.height() / 2) - 8));

    void *buf;
    size_t length;
    out.write_to_buffer(".png", &buf, &length);

    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", "png");
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}