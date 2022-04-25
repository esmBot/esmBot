#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Crop(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());

    vector<VImage> img;
    int finalHeight = 0;
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * page_height, width, page_height) : in;
      int frameWidth = img_frame.width();
      int frameHeight = img_frame.height();
      bool widthOrHeight = frameWidth / frameHeight >= 1;
      int size = widthOrHeight ? frameHeight : frameWidth;
      // img_frame.crop(frameWidth - size, frameHeight - size, size, size);
      VImage result = img_frame.smartcrop(
          size, size,
          VImage::option()->set("interesting", VIPS_INTERESTING_CENTRE));
      finalHeight = size;
      img.push_back(result);
    }

    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, finalHeight);
    if (delay) final.set("delay", delay);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0) : 0);

    vips_thread_shutdown();

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", type);
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}