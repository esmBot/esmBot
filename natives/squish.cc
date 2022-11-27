#include <math.h>
#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Squish(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option();

    VImage in =
        VImage::new_from_buffer(
            data.Data(), data.Length(), "",
            type == "gif" ? options->set("n", -1)->set("access", "sequential")
                          : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
      in = in.bandjoin(255);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 30;
    double mult = (2 * M_PI) / nPages;

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      double newWidth = (sin(i * mult) / 4) + 0.75;
      double newHeight = (cos(i * mult) / 4) + 0.75;
      VImage resized =
          img_frame.resize(newWidth, VImage::option()->set("vscale", newHeight))
              .gravity(VIPS_COMPASS_DIRECTION_CENTRE, width, pageHeight);
      img.push_back(resized);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);
    if (type != "gif") {
      vector<int> delay(30, 50);
      final.set("delay", delay);
    }

    void *buf;
    size_t length;
    final.write_to_buffer(".gif", &buf, &length);

    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", "gif");
  } catch (std::exception const &err) {
    Napi::Error::New(env, err.what()).ThrowAsJavaScriptException();
  } catch (...) {
    Napi::Error::New(env, "Unknown error").ThrowAsJavaScriptException();
  }

  vips_error_clear();
  vips_thread_shutdown();
  return result;
}