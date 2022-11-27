#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Mirror(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool vertical = obj.Has("vertical")
                        ? obj.Get("vertical").As<Napi::Boolean>().Value()
                        : false;
    bool first =
        obj.Has("first") ? obj.Get("first").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    VImage out;

    if (vertical) {
      if (type == "gif") {
        // once again, libvips gif handling is both a blessing and a curse
        vector<VImage> img;
        int pageHeight = vips_image_get_page_height(in.get_image());
        int nPages = vips_image_get_n_pages(in.get_image());
        bool isOdd = pageHeight % 2;
        for (int i = 0; i < nPages; i++) {
          int x = (i * pageHeight) + (first ? 0 : (pageHeight / 2));
          VImage cropped = in.crop(0, x, in.width(), pageHeight / 2);
          VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
          VImage final = VImage::arrayjoin(
              {first ? cropped : flipped, first ? flipped : cropped},
              VImage::option()->set("across", 1));
          img.push_back(final);
        }
        out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
        out.set(VIPS_META_PAGE_HEIGHT, pageHeight - (isOdd ? 1 : 0));
      } else {
        VImage cropped = in.extract_area(0, 0, in.width(), in.height() / 2);
        VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
        out = VImage::arrayjoin({cropped, flipped},
                                VImage::option()->set("across", 1));
      }
    } else {
      if (first) {
        VImage cropped = in.extract_area(0, 0, in.width() / 2, in.height());
        VImage flipped = cropped.flip(VIPS_DIRECTION_HORIZONTAL);
        out = VImage::arrayjoin({cropped, flipped});
      } else {
        int size = in.width() / 2;
        VImage cropped = in.extract_area(size, 0, size, in.height());
        VImage flipped = cropped.flip(VIPS_DIRECTION_HORIZONTAL);
        out = VImage::arrayjoin({flipped, cropped});
      }
    }

    void *buf;
    size_t length;
    out.write_to_buffer(("." + type).c_str(), &buf, &length);

    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
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
