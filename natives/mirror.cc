#include <napi.h>

#include <iostream>
#include <list>
#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Mirror(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    bool vertical = obj.Has("vertical")
                        ? obj.Get("vertical").As<Napi::Boolean>().Value()
                        : false;
    bool first =
        obj.Has("first") ? obj.Get("first").As<Napi::Boolean>().Value() : false;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

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
        int page_height = vips_image_get_page_height(in.get_image());
        int n_pages = vips_image_get_n_pages(in.get_image());
        bool isOdd = page_height % 2;
        for (int i = 0; i < n_pages; i++) {
          int x = (i * page_height) + (first ? 0 : (page_height / 2));
          VImage cropped = in.crop(0, x, in.width(), page_height / 2);
          VImage flipped = cropped.flip(VIPS_DIRECTION_VERTICAL);
          VImage final = VImage::arrayjoin(
              {first ? cropped : flipped, first ? flipped : cropped},
              VImage::option()->set("across", 1));
          img.push_back(final);
        }
        out = VImage::arrayjoin(img, VImage::option()->set("across", 1));
        out.set(VIPS_META_PAGE_HEIGHT, page_height - (isOdd ? 1 : 0));
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

    if (delay) out.set("delay", delay);

    void *buf;
    size_t length;
    out.write_to_buffer(("." + type).c_str(), &buf, &length);

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
