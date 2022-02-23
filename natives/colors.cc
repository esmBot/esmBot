#include <napi.h>

#include <iostream>
#include <list>
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
    bool old =
        obj.Has("old") ? obj.Get("old").As<Napi::Boolean>().Value() : false;
    string color = obj.Get("color").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);

    VImage out;

    if (color == "blurple") {
      out = in; // TODO: figure out how to implement blurple
    } else if (color == "grayscale") {
      out = in.colourspace(VIPS_INTERPRETATION_B_W);
    } else if (color == "sepia") {
      out = in.flatten().recomb(sepia);
    }

    /*for (Image &image : coalesced) {
      if (color == "blurple") {
        image.threshold(49151.25);
        image.levelColors(old ? "#7289DA" : "#5865F2", "white");
      } else if (color == "grayscale") {
        image.quantizeColorSpace(GRAYColorspace);
        image.quantizeColors(256);
      } else if (color == "sepia") {
        image.sepiaTone(49151.25);
      }
      image.magick(type);
      image.animationDelay(delay == 0 ? image.animationDelay() : delay);
      colored.push_back(image);
    }*/

    if (delay) out.set("delay", delay);

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
