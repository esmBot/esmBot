#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Resize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool stretch = obj.Has("stretch")
                       ? obj.Get("stretch").As<Napi::Boolean>().Value()
                       : false;
    bool wide =
        obj.Has("wide") ? obj.Get("wide").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);

    VImage out;

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());

    int finalHeight;
    if (stretch) {
      out = in.resize(
          512.0 / (double)width,
          VImage::option()->set("vscale", 512.0 / (double)page_height));
      finalHeight = 512;
    } else if (wide) {
      out = in.resize(9.5, VImage::option()->set("vscale", 0.5));
      finalHeight = page_height / 2;
    } else {
      out = in.resize(0.1).resize(
          10, VImage::option()->set("kernel", VIPS_KERNEL_NEAREST));
      finalHeight = page_height;
    }
    out.set(VIPS_META_PAGE_HEIGHT, finalHeight);

    void *buf;
    size_t length;
    out.write_to_buffer(("." + type).c_str(), &buf, &length);

    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}