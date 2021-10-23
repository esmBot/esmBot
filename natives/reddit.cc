#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Reddit(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string text = obj.Get("caption").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image watermark;
    Image text_image;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }

    watermark.read("./assets/images/reddit.png");
    text_image.textGravity(Magick::WestGravity);
    text_image.font("Roboto");
    text_image.fontPointsize(47);
    text_image.backgroundColor("none");
    text_image.read("pango:<span foreground='white'>" + text + "</span>");

    watermark.composite(text_image, Geometry("+375+46"),
                        Magick::OverCompositeOp);

    string query(to_string(frames.front().baseColumns()) + "x");
    watermark.scale(Geometry(query));

    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image final;
      list<Image> to_append;
      to_append.push_back(image);
      to_append.push_back(watermark);
      appendImages(&final, to_append.begin(), to_append.end(), true);
      final.repage();
      image.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDitherMethod(FloydSteinbergDitherMethod);
        image.quantize();
      }
    }

    writeImages(mid.begin(), mid.end(), &blob);

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                blob.length()));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}