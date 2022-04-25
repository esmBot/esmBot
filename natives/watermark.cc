#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Watermark(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string water = obj.Get("water").As<Napi::String>().Utf8Value();
    int gravity = obj.Get("gravity").As<Napi::Number>().Int64Value();
    bool resize = obj.Has("resize")
                      ? obj.Get("resize").As<Napi::Boolean>().Value()
                      : false;
    float yscale = obj.Has("yscale")
                       ? obj.Get("yscale").As<Napi::Number>().FloatValue()
                       : false;
    bool append = obj.Has("append")
                      ? obj.Get("append").As<Napi::Boolean>().Value()
                      : false;
    bool mc = obj.Has("mc") ? obj.Get("mc").As<Napi::Boolean>().Value() : false;
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    string merged = basePath + water;
    VImage watermark = VImage::new_from_file(merged.c_str());

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());

    if (resize && append) {
      watermark = watermark.resize((double)width / (double)watermark.width());
    } else if (resize && yscale) {
      watermark = watermark.resize(
          (double)width / (double)watermark.width(),
          VImage::option()->set("vscale", (double)(page_height * yscale) /
                                              (double)watermark.height()));
    } else if (resize) {
      watermark =
          watermark.resize((double)page_height / (double)watermark.height());
    }

    vector<VImage> img;
    int addedHeight = 0;
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * page_height, width, page_height) : in;
      if (append) {
        VImage appended = img_frame.join(watermark, VIPS_DIRECTION_VERTICAL,
                                         VImage::option()->set("expand", true));
        addedHeight = watermark.height();
        img.push_back(appended);
      } else if (mc) {
        VImage padded =
            img_frame.embed(0, 0, width, page_height + 15,
                            VImage::option()->set("background", 0xffffff));
        VImage composited =
            padded.composite2(watermark, VIPS_BLEND_MODE_OVER,
                              VImage::option()
                                  ->set("x", width - 190)
                                  ->set("y", padded.height() - 22));
        addedHeight = 15;
        img.push_back(composited);
      } else {
        int x = 0, y = 0;
        switch (gravity) {
          case 1:
            break;
          case 2:
            x = (width / 2) - (watermark.width() / 2);
            break;
          case 3:
            x = width - watermark.width();
            break;
          case 5:
            x = (width / 2) - (watermark.width() / 2);
            y = (page_height / 2) - (watermark.height() / 2);
            break;
          case 6:
            x = width - watermark.width();
            y = (page_height / 2) - (watermark.height() / 2);
            break;
          case 8:
            x = (width / 2) - (watermark.width() / 2);
            y = page_height - watermark.height();
            break;
          case 9:
            x = width - watermark.width();
            y = page_height - watermark.height();
            break;
        }
        VImage composited =
            img_frame.composite2(watermark, VIPS_BLEND_MODE_OVER,
                                 VImage::option()->set("x", x)->set("y", y));
        img.push_back(composited);
      }
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, page_height + addedHeight);
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
