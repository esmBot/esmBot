#include <Magick++.h>
#include <napi.h>

#include <iostream>
#include <list>

using namespace std;
using namespace Magick;

void *memset16(void *m, uint16_t val, size_t count) {
  uint16_t *buf = (uint16_t *)m;

  while (count--) *buf++ = val;
  return m;
}

Napi::Value Speed(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool slow =
        obj.Has("slow") ? obj.Get("slow").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;
    int speed =
        obj.Has("speed") ? obj.Get("speed").As<Napi::Number>().Int32Value() : 2;

    Napi::Object result = Napi::Object::New(env);

    char *fileData = data.Data();

    char *match = (char *)"\x00\x21\xF9\x04";

    // if passed a delay, use that. otherwise iterate over every frame.
    if (delay == 0) {
      vector<uint16_t> old_delays;
      bool removeFrames = false;
      char *lastPos;

      int amount = 0;

      lastPos = (char *)memchr(fileData, '\x00', data.Length());
      while (lastPos != NULL) {
        if (memcmp(lastPos, match, 4) != 0) {
          lastPos = (char *)memchr(lastPos + 1, '\x00',
                                   (data.Length() - (lastPos - fileData)) - 1);
          continue;
        }
        ++amount;
        uint16_t old_delay;
        memcpy(&old_delay, lastPos + 5, 2);
        old_delays.push_back(old_delay);
        lastPos = (char *)memchr(lastPos + 1, '\x00',
                                 (data.Length() - (lastPos - fileData)) - 1);
      }

      int currentFrame = 0;
      lastPos = (char *)memchr(fileData, '\x00', data.Length());
      while (lastPos != NULL) {
        if (memcmp(lastPos, match, 4) != 0) {
          lastPos = (char *)memchr(lastPos + 1, '\x00',
                                   (data.Length() - (lastPos - fileData)) - 1);
          continue;
        }
        uint16_t new_delay = slow ? old_delays[currentFrame] * speed
                                  : old_delays[currentFrame] / speed;
        if (!slow && new_delay <= 1) {
          removeFrames = true;
          break;
        }
        memset16(lastPos + 5, new_delay, 1);
        lastPos = (char *)memchr(lastPos + 1, '\x00',
                                 (data.Length() - (lastPos - fileData)) - 1);
        ++currentFrame;
      }

      result.Set("data",
                 Napi::Buffer<char>::Copy(env, fileData, data.Length()));

      if (removeFrames) {
        Blob blob;

        list<Image> frames;
        try {
          readImages(&frames, Blob(data.Data(), data.Length()));
        } catch (Magick::WarningCoder &warning) {
          cerr << "Coder Warning: " << warning.what() << endl;
        } catch (Magick::Warning &warning) {
          cerr << "Warning: " << warning.what() << endl;
        }

        for (list<Image>::iterator i = frames.begin(); i != frames.end(); ++i) {
          int index = distance(frames.begin(), i);
          if (index >= (int)old_delays.size()) {
            old_delays.resize(index+1);
            old_delays[index] = old_delays[index-1];
          }
          i->animationDelay(old_delays[index]);
        }

        for (int i = 0; i < speed - 1; ++i) {
          auto it = frames.begin();
          while(it != frames.end() && ++it != frames.end()) it = frames.erase(it);
        }

        for_each(frames.begin(), frames.end(), magickImage(type));
        writeImages(frames.begin(), frames.end(), &blob);
        result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                    blob.length()));
      }
    } else {
      char *lastPos;

      bool removeFrames = false;

      lastPos = (char *)memchr(fileData, '\x00', data.Length());
      while (lastPos != NULL) {
        if (memcmp(lastPos, match, 4) != 0) {
          lastPos = (char *)memchr(lastPos + 1, '\x00',
                                   (data.Length() - (lastPos - fileData)) - 1);
          continue;
        }
        uint16_t old_delay;
        memcpy(&old_delay, lastPos + 5, 2);
        int new_delay = slow ? delay * speed : delay / speed;
        if (!slow && new_delay <= 1) {
          removeFrames = true;
        }
        break;
      }

      if (removeFrames) {
        Blob blob;

        list<Image> frames;
        try {
          readImages(&frames, Blob(data.Data(), data.Length()));
        } catch (Magick::WarningCoder &warning) {
          cerr << "Coder Warning: " << warning.what() << endl;
        } catch (Magick::Warning &warning) {
          cerr << "Warning: " << warning.what() << endl;
        }

        for (int i = 0; i < speed - 1; ++i) {
          auto it = frames.begin();
          while(it != frames.end() && ++it != frames.end()) it = frames.erase(it);
        }

        for_each(frames.begin(), frames.end(), magickImage(type));
        writeImages(frames.begin(), frames.end(), &blob);
        result.Set("data", Napi::Buffer<char>::Copy(env, (char *)blob.data(),
                                                    blob.length()));
      } else {
        while (lastPos != NULL) {
          if (memcmp(lastPos, match, 4) != 0) {
            lastPos =
                (char *)memchr(lastPos + 1, '\x00',
                               (data.Length() - (lastPos - fileData)) - 1);
            continue;
          }
          uint16_t old_delay;
          memcpy(&old_delay, lastPos + 5, 2);
          int new_delay = slow ? delay * speed : delay / speed;
          memset16(lastPos + 5, new_delay, 1);
          lastPos = (char *)memchr(lastPos + 1, '\x00',
                                   (data.Length() - (lastPos - fileData)) - 1);
        }
      }
    }

    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}
