#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Reddit(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string text = obj.Get("caption").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    string assetPath = basePath + "assets/images/reddit.png";
    VImage tmpl = VImage::new_from_file(assetPath.c_str());

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());

    string captionText = "<span foreground=\"white\">" + text + "</span>";

    VImage textImage =
        VImage::text(captionText.c_str(), VImage::option()
                                              ->set("rgba", true)
                                              ->set("font", "Roboto 62")
                                              ->set("align", VIPS_ALIGN_LOW));

    VImage composited =
        tmpl.composite2(textImage, VIPS_BLEND_MODE_OVER,
                        VImage::option()->set("x", 375)->set(
                            "y", (tmpl.height() - textImage.height()) - 64));
    VImage watermark =
        composited.resize((double)width / (double)composited.width());

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      VImage frame = img_frame.join(watermark, VIPS_DIRECTION_VERTICAL,
                                    VImage::option()->set("expand", true));
      img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight + watermark.height());

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