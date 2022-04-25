#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Deepfry(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    Napi::Object result = Napi::Object::New(env);

    VImage in = VImage::new_from_buffer(
                    data.Data(), data.Length(), "",
                    VImage::option()->set("access", "sequential")->set("n", -1))
                    .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int page_height = vips_image_get_page_height(in.get_image());

    VImage fried = (in * 1.3 - (255.0 * 1.3 - 255.0)) * 1.5;
    void *jpgBuf;
    size_t jpgLength;
    fried.write_to_buffer(".jpg", &jpgBuf, &jpgLength,
                          VImage::option()->set("Q", 1)->set("strip", true));
    VImage final = VImage::new_from_buffer(jpgBuf, jpgLength, "");
    final.set(VIPS_META_PAGE_HEIGHT, page_height);
    if (delay) final.set("delay", delay);

    void *buf;
    size_t length;
    final.write_to_buffer(("." + type).c_str(), &buf, &length,
                          VImage::option()->set("dither", 0));

    vips_thread_shutdown();

    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}