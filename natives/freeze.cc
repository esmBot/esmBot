#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Freeze(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool loop =
        obj.Has("loop") ? obj.Get("loop").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int frame = obj.Has("frame")
                    ? obj.Get("frame").As<Napi::Number>().Int32Value()
                    : -1;

    char *fileData = data.Data();
    char *match = (char *)"\x21\xFF\x0BNETSCAPE2.0\x03\x01";
    char *descriptor = (char *)"\x2C\x00\x00\x00\x00";
    char *lastPos;

    bool none = true;

    if (loop) {
      char *newData = (char *)malloc(data.Length() + 19);
      memcpy(newData, fileData, data.Length());
      lastPos = (char *)memchr(newData, '\x2C', data.Length());
      while (lastPos != NULL) {
        if (memcmp(lastPos, descriptor, 5) != 0) {
          lastPos = (char *)memchr(lastPos + 1, '\x2C',
                                   (data.Length() - (lastPos - newData)) - 1);
          continue;
        }

        memcpy(lastPos + 19, lastPos, (data.Length() - (lastPos - newData)));
        memcpy(lastPos, match, 16);
        memcpy(lastPos + 16, "\x00\x00\x00", 3);
        result.Set("data",
                   Napi::Buffer<char>::Copy(env, newData, data.Length() + 19));
        none = false;
        break;
      }
      if (none)
        result.Set("data",
                   Napi::Buffer<char>::Copy(env, newData, data.Length()));
    } else if (frame >= 0 && !loop) {
      VOption *options = VImage::option()->set("access", "sequential");

      VImage in = VImage::new_from_buffer(
                      data.Data(), data.Length(), "",
                      type == "gif" ? options->set("n", -1) : options)
                      .colourspace(VIPS_INTERPRETATION_sRGB);
      if (!in.has_alpha()) in = in.bandjoin(255);

      int pageHeight = vips_image_get_page_height(in.get_image());
      int nPages = vips_image_get_n_pages(in.get_image());
      int framePos = clamp(frame, 0, (int)nPages);
      VImage out = in.crop(0, 0, in.width(), pageHeight * (framePos + 1));
      out.set(VIPS_META_PAGE_HEIGHT, pageHeight);
      out.set("loop", loop ? 0 : 1);

      void *buf;
      size_t length;
      out.write_to_buffer(("." + type).c_str(), &buf, &length);

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    } else {
      lastPos = (char *)memchr(fileData, '\x21', data.Length());
      while (lastPos != NULL) {
        if (memcmp(lastPos, match, 16) != 0) {
          lastPos = (char *)memchr(lastPos + 1, '\x21',
                                   (data.Length() - (lastPos - fileData)) - 1);
          continue;
        }
        memcpy(lastPos, lastPos + 19,
               (data.Length() - (lastPos - fileData)) - 19);
        result.Set("data",
                   Napi::Buffer<char>::Copy(env, fileData, data.Length() - 19));
        none = false;
        break;
      }
      if (none)
        result.Set("data",
                   Napi::Buffer<char>::Copy(env, fileData, data.Length()));
    }

    result.Set("type", type);
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}
