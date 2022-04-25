#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Sonic(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string text = obj.Get("text").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    string assetPath = basePath + "assets/images/sonic.jpg";
    VImage bg = VImage::new_from_file(assetPath.c_str());

    VImage textImage =
        VImage::text(("<span foreground=\"white\">" + text + "</span>").c_str(),
                     VImage::option()
                         ->set("rgba", true)
                         ->set("align", VIPS_ALIGN_CENTRE)
                         ->set("font", "Bitstream Vera Sans")
                         ->set("width", 542)
                         ->set("height", 390))
            .gravity(VIPS_COMPASS_DIRECTION_CENTRE, 542, 390);

    VImage out = bg.composite2(textImage, VIPS_BLEND_MODE_OVER,
                               VImage::option()->set("x", 391)->set("y", 84));

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