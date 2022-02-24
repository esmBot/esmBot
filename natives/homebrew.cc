#include <napi.h>

#include <list>
#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Homebrew(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    string assetPath = basePath + "assets/images/hbc.png";
    VImage bg = VImage::new_from_file(assetPath.c_str());

    VImage text =
        VImage::text(("<span letter_spacing=\"-5120\" color=\"white\">" +
                      caption + "</span>")
                         .c_str(),
                     VImage::option()
                         ->set("rgba", true)
                         ->set("align", VIPS_ALIGN_CENTRE)
                         ->set("font", "PF Square Sans Pro 96"));

    VImage out = bg.composite2(text, VIPS_BLEND_MODE_OVER,
                               VImage::option()
                                   ->set("x", 400 - (text.width() / 2))
                                   ->set("y", 300 - (text.height() / 2) - 8));

    void *buf;
    size_t length;
    out.write_to_buffer(".png", &buf, &length);

    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", "png");
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}