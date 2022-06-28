#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Uncaption(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    float tolerance = obj.Has("tolerance")
                          ? obj.Get("tolerance").As<Napi::Number>().FloatValue()
                          : 0.5;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option();

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1)->set("access", "sequential") : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());

    VImage first =
        in.crop(0, 0, 3, pageHeight).colourspace(VIPS_INTERPRETATION_B_W) >
        (255 * tolerance);
    int top, captionWidth, captionHeight;
    first.find_trim(&top, &captionWidth, &captionHeight);

    vector<VImage> img;
    int newHeight = pageHeight - top;
    if (top == pageHeight) {
      newHeight = pageHeight;
      top = 0;
    }
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          in.crop(0, (i * pageHeight) + top, width, newHeight);
      img.push_back(img_frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, newHeight);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1)  : 0);

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
