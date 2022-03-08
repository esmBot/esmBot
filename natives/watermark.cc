#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Magick::GravityType NapiToGravity(const Napi::Value gravity) {
  Magick::GravityType g = Magick::GravityType();
  if (gravity.IsNumber()) {
    return Magick::GravityType(gravity.As<Napi::Number>().Int64Value());
  }else if (gravity.IsString()) {
    string grav = gravity.As<Napi::String>().Utf8Value();
    if (grav == "northwest") {
      g = Magick::NorthWestGravity;
    } else if (grav == "north") {
      g = Magick::NorthGravity;
    } else if (grav == "northeast") {
      g = Magick::NorthEastGravity;
    } else if (grav == "west") {
      g = Magick::WestGravity;
    } else if (grav == "center") {
      g = Magick::CenterGravity;
    } else if (grav == "east") {
      g = Magick::EastGravity;
    } else if (grav == "southwest") {
      g = Magick::SouthWestGravity;
    } else if (grav == "south") {
      g = Magick::SouthGravity;
    } else if (grav == "southeast") {
      g = Magick::SouthEastGravity;
    } else if (grav == "forget") {
      g = Magick::ForgetGravity;
    } else if (grav == "north_east") {
      g = Magick::NorthEastGravity;
    } else if (grav == "north_west") {
      g = Magick::NorthWestGravity;
    } else if (grav == "south_east") {
      g = Magick::SouthEastGravity;
    } else if (grav == "south_west") {
      g = Magick::SouthWestGravity;
    } else {
      g = Magick::CenterGravity;
    }
  }
  return g;
}

Napi::Value Watermark(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string water = obj.Get("water").As<Napi::String>().Utf8Value();
    Magick::GravityType gravity = NapiToGravity(obj.Get("gravity"));
    bool resize = obj.Has("resize")
                      ? obj.Get("resize").As<Napi::Boolean>().Value()
                      : false;
    float yscale = obj.Has("yscale")
	    ? obj.Get("yscale").As<Napi::Number>().FloatValue() : false;
    bool append = obj.Has("append")
                      ? obj.Get("append").As<Napi::Boolean>().Value()
                      : false;
    bool mc = obj.Has("mc") ? obj.Get("mc").As<Napi::Boolean>().Value() : false;
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
    watermark.read(water);
    if (resize && append) {
      string query(to_string(frames.front().baseColumns()) + "x");
      watermark.scale(Geometry(query));
    } else if (resize&&yscale) {
      string query(to_string(frames.front().baseColumns())+"x"+to_string(frames.front().baseRows()*yscale)+"!");
      watermark.resize(Geometry(query));     
    } else if (resize) {
      string query("x"+to_string(frames.front().baseRows()));
      watermark.scale(Geometry(query));
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    for (Image &image : coalesced) {
      Image final;
      if (append) {
        list<Image> to_append;
        to_append.push_back(image);
        to_append.push_back(watermark);
        appendImages(&final, to_append.begin(), to_append.end(), true);
        final.repage();
      } else if (mc) {
        image.backgroundColor("white");
        image.extent(Geometry(image.columns(), image.rows() + 15));
        image.composite(watermark, gravity,
                        Magick::OverCompositeOp);
        final = image;
      } else {
        image.composite(watermark, gravity,
                        Magick::OverCompositeOp);
        final = image;
      }
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
