#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Trump(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image watermark;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    watermark.read("./assets/images/trump.png");
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image watermark_new = watermark;
      image.virtualPixelMethod(Magick::TransparentVirtualPixelMethod);
      image.backgroundColor("none");
      image.scale(Geometry("365x179!"));
      double arguments[16] = {0,   0,   207, 268, 365, 0,   548, 271,
                              365, 179, 558, 450, 0,   179, 193, 450};
      image.distort(Magick::PerspectiveDistortion, 16, arguments, true);
      image.extent(Geometry("800x450"), Magick::CenterGravity);
      watermark_new.composite(image, Geometry("-25+134"),
                              Magick::DstOverCompositeOp);
      watermark_new.magick(type);
      watermark_new.animationDelay(delay == 0 ? image.animationDelay() : delay);
      watermark_new.gifDisposeMethod(Magick::BackgroundDispose);
      mid.push_back(watermark_new);
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