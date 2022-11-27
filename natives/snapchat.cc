#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Snapchat(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string caption = obj.Get("caption").As<Napi::String>().Utf8Value();
    float pos =
        obj.Has("pos") ? obj.Get("pos").As<Napi::Number>().FloatValue() : 0.5;
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
      in = in.bandjoin(255);

    int width = in.width();
    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int size = width / 20;
    int textWidth = width - ((width / 25) * 2);

    string font_string =
        "Helvetica Neue, Twemoji Color Font " + to_string(size);

    VImage textIn = VImage::text(
        ".", VImage::option()->set(
                 "fontfile", (basePath + "assets/fonts/caption2.ttf").c_str()));
    textIn = VImage::text(
        ("<span foreground=\"white\" background=\"#000000B2\">" + caption +
         "</span>")
            .c_str(),
        VImage::option()
            ->set("rgba", true)
            ->set("align", VIPS_ALIGN_CENTRE)
            ->set("font", font_string.c_str())
            ->set("fontfile", (basePath + "assets/fonts/twemoji.otf").c_str())
            ->set("width", textWidth));
    int bgHeight = textIn.height() + (width / 25);
    textIn =
        ((textIn == (vector<double>){0, 0, 0, 0}).bandand())
            .ifthenelse({0, 0, 0, 178}, textIn)
            .embed((width / 2) - (textIn.width() / 2),
                   (bgHeight / 2) - (textIn.height() / 2), width, bgHeight,
                   VImage::option()
                       ->set("extend", "background")
                       ->set("background", (vector<double>){0, 0, 0, 178}));

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;
      img_frame = img_frame.composite2(
          textIn, VIPS_BLEND_MODE_OVER,
          VImage::option()->set("x", 0)->set("y", pageHeight * pos));
      img.push_back(img_frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0)->set("reoptimise", 1)
                      : 0);

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