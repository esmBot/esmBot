#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Motivate(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string top_text = obj.Get("top").As<Napi::String>().Utf8Value();
    string bottom_text = obj.Get("bottom").As<Napi::String>().Utf8Value();
    string font = obj.Get("font").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    list<Image> mid;
    Image top;
    Image bottom;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    top.size(Geometry("600"));
    top.backgroundColor("black");
    top.font("Times");
    top.textGravity(Magick::CenterGravity);
    top.fontPointsize(56);
    top.read("pango:<span font_family=\"" +
                       (font == "roboto" ? "Roboto Condensed" : font) +
                       "\" foreground='white'>" + top_text + "</span>");
    top.extent(Geometry(bottom_text != "" ? to_string(top.columns()) + "x" +
                                                to_string(top.rows())
                                          : to_string(top.columns()) + "x" +
                                                to_string(top.rows() + 20)),
               "black", Magick::NorthGravity);

    if (bottom_text != "") {
      bottom.size(Geometry("600"));
      bottom.backgroundColor("black");
      bottom.font("Times");
      bottom.textGravity(Magick::CenterGravity);
      bottom.fontPointsize(28);
      bottom.read("pango:<span font_family=\"" +
                       (font == "roboto" ? "Roboto Condensed" : font) +
                       "\" foreground='white'>" + bottom_text + "</span>");
      bottom.extent(Geometry(to_string(bottom.columns()) + "x" +
                             to_string(bottom.rows() + 20)),
                    "black", Magick::NorthGravity);
    }

    for (Image &image : coalesced) {
      Image final;
      image.scale(Geometry(500, 500));
      image.borderColor("black");
      image.border(Geometry(5, 5));
      image.borderColor("white");
      image.border(Geometry(3, 3));
      image.backgroundColor("black");
      image.extent(Geometry(600, image.rows() + 50), Magick::CenterGravity);

      list<Image> to_append;
      to_append.push_back(image);
      to_append.push_back(top);
      if (bottom_text != "") to_append.push_back(bottom);
      appendImages(&final, to_append.begin(), to_append.end(), true);
      final.repage();
      final.magick(type);
      final.animationDelay(delay == 0 ? image.animationDelay() : delay);
      mid.push_back(final);
    }

    optimizeTransparency(mid.begin(), mid.end());

    if (type == "gif") {
      for (Image &image : mid) {
        image.quantizeDither(false);
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
