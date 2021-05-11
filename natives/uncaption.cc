#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>
#include <string_view>

using namespace std;
using namespace Magick;

template <typename T>
constexpr auto type_name() noexcept {
  std::string_view name = "Error: unsupported compiler", prefix, suffix;
#ifdef __clang__
  name = __PRETTY_FUNCTION__;
  prefix = "auto type_name() [T = ";
  suffix = "]";
#elif defined(__GNUC__)
  name = __PRETTY_FUNCTION__;
  prefix = "constexpr auto type_name() [with T = ";
  suffix = "]";
#elif defined(_MSC_VER)
  name = __FUNCSIG__;
  prefix = "auto __cdecl type_name<";
  suffix = ">(void) noexcept";
#endif
  name.remove_prefix(prefix.size());
  name.remove_suffix(suffix.size());
  return name;
}

Napi::Value Uncaption(const Napi::CallbackInfo &info) {
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
    readImages(&frames, Blob(data.Data(), data.Length()));
    coalesceImages(&coalesced, frames.begin(), frames.end());

    Image firstImage = coalesced.front();
    ssize_t columns = firstImage.columns();
    ssize_t rows = firstImage.rows();
    //ssize_t column;
    ssize_t row;
    //bool found = false;
    for (row = 0; row < rows; ++row) {
        //for (column = 0; column < columns; ++column) {
            ColorGray color = firstImage.pixelColor(0, row);
            if (color.shade() < 0.9765625) {
                //found = true;
                break;
            }
        //}
        //if (found) break;
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
  } catch (Napi::Error const &err) {
    throw err;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}