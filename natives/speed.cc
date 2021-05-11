#include <Magick++.h>
#include <napi.h>

#include <list>

using namespace std;
using namespace Magick;

Napi::Value Speed(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    string path = obj.Get("path").As<Napi::String>().Utf8Value();
    bool slow =
        obj.Has("slow") ? obj.Get("slow").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;
    int speed =
        obj.Has("speed") ? obj.Get("speed").As<Napi::Number>().Int32Value() : 2;

    Blob blob;

    list<Image> frames;
    readImages(&frames, path);

    // if passed a delay, use that. otherwise use the average frame delay.
    if (delay == 0) {
      vector<int> old_delays;
      bool removeFrames = false;
      for (Image &image : frames) {
        int animation_delay = image.animationDelay();
        old_delays.push_back(animation_delay);
      }

      for (Image &image : frames) {
        int old_delay = image.animationDelay();
        int new_delay = slow ? old_delay * speed : old_delay / speed;
        if (!slow && new_delay <= 1) {
          removeFrames = true;
          break;
        }
        image.animationDelay(new_delay);
        image.gifDisposeMethod(Magick::BackgroundDispose);
      }

      if (removeFrames) {
        for (list<Image>::iterator i = frames.begin(); i != frames.end(); ++i) {
          int index = distance(frames.begin(), i);
          i->animationDelay(old_delays[index]);
        }

        for (int i = 0; i < speed - 1; ++i) {
          frames.remove_if([counter = 0](const auto x) mutable {
            return ++counter % 2 == 0;
          });
        }
      }
    } else {
      int new_delay = slow ? delay * speed : delay / speed;
      if (!slow && new_delay <= 1) {
        for (int i = 0; i < speed - 1; ++i) {
          frames.remove_if([counter = 0](const auto x) mutable {
            return ++counter % 2 == 0;
          });
        }
      } else {
        for_each(frames.begin(), frames.end(), animationDelayImage(new_delay));
      }
    }

    for_each(frames.begin(), frames.end(), magickImage(type));

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