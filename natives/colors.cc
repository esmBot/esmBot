#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

VImage sepia = VImage::new_matrixv(3, 3, 0.3588, 0.7044, 0.1368, 0.2990, 0.5870,
                                   0.1140, 0.2392, 0.4696, 0.0912);

Napi::Value Colors(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string color = obj.Get("color").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);

    VImage out;

    if (color == "grayscale") {
      out = in.colourspace(VIPS_INTERPRETATION_B_W);
    } else if (color == "sepia") {
      out = in.flatten().recomb(sepia);
    }

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
