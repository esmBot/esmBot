#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Freeze(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool loop =
        obj.Has("loop") ? obj.Get("loop").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;
    int frame = obj.Has("frame")
                    ? obj.Get("frame").As<Napi::Number>().Int32Value()
                    : -1;

    Blob blob;

    list<Image> frames;
    readImages(&frames, Blob(data.Data(), data.Length()));

    if (frame >= 0 && !loop) {
      size_t frameSize = frames.size();
      int framePos = clamp(frame, 0, (int)frameSize);
      frames.resize(framePos + 1);
    }
    for_each(frames.begin(), frames.end(),
             animationIterationsImage(loop ? 0 : 1));
    for_each(frames.begin(), frames.end(), magickImage(type));

    if (delay != 0)
      for_each(frames.begin(), frames.end(), animationDelayImage(delay));
    writeImages(frames.begin(), frames.end(), &blob);

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