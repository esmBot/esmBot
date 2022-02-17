#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Uncaption(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    float tolerance = obj.Has("tolerance") ? obj.Get("tolerance").As<Napi::Number>().FloatValue() : 0.95;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    Image firstImage = coalesced.front();
    ssize_t columns = firstImage.columns();
    ssize_t rows = firstImage.rows();
    ssize_t row;
    for (row = 0; row < rows; ++row) {
      ColorGray color = firstImage.pixelColor(0, row);
      if (color.shade() < tolerance) {
        break;
      }
    }
    Geometry geom = Geometry(columns, row == rows ? rows : rows - row, 0,
                             row == rows ? 0 : row);

    for (Image &image : coalesced) {
      image.virtualPixelMethod(Magick::TransparentVirtualPixelMethod);
      image.backgroundColor("none");
      image.extent(geom);
      image.magick(type);
      mid.push_back(image);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
        image.quantize();
        if (delay != 0) image.animationDelay(delay);
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
