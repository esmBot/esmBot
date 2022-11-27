#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value ToGif(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    if (type == "gif") {
      result.Set("data", data);
      result.Set("type", "gif");
    } else {
      VOption *options = VImage::option()->set("access", "sequential");

      VImage in = VImage::new_from_buffer(data.Data(), data.Length(), "",
                                          type == "webp" ? options->set("n", -1)
                                                         : options);

      void *buf;
      size_t length;
      in.write_to_buffer(".gif", &buf, &length);

      result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
      result.Set("type", "gif");
    }
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}