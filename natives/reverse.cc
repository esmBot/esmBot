#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

Napi::Value Reverse(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool soos =
        obj.Has("soos") ? obj.Get("soos").As<Napi::Boolean>().Value() : false;
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Blob blob;

    list<Image> frames;
    list<Image> coalesced;
    try {
      readImages(&frames, Blob(data.Data(), data.Length()));
    } catch (Magick::WarningCoder &warning) {
      cerr << "Coder Warning: " << warning.what() << endl;
    } catch (Magick::Warning &warning) {
      cerr << "Warning: " << warning.what() << endl;
    }
    coalesceImages(&coalesced, frames.begin(), frames.end());

    if (soos) {
      list<Image> copy = coalesced;
      copy.reverse();
      copy.pop_back();
      copy.pop_front();
      coalesced.insert(coalesced.end(), copy.begin(), copy.end());
    } else {
      coalesced.reverse();
    }

    for_each(coalesced.begin(), coalesced.end(), magickImage("GIF"));

    optimizeTransparency(coalesced.begin(), coalesced.end());

    for (Image &image : coalesced) {
      image.quantizeDither(false);
      image.quantize();
      if (delay != 0) image.animationDelay(delay);
    }

    writeImages(coalesced.begin(), coalesced.end(), &blob);

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                blob.length()));
    result.Set("type", "gif");
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}