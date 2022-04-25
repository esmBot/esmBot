#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Flag(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string overlay = obj.Get("overlay").As<Napi::String>().Utf8Value();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();
    int delay =
        obj.Has("delay") ? obj.Get("delay").As<Napi::Number>().Int32Value() : 0;

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = vips_image_get_n_pages(in.get_image());

    string assetPath = basePath + overlay;
    VImage overlayInput = VImage::new_from_file(assetPath.c_str());
    VImage overlayImage = overlayInput.resize(
        (double)width / (double)overlayInput.width(),
        VImage::option()->set(
            "vscale", (double)page_height / (double)overlayInput.height()));
    if (!overlayImage.has_alpha()) {
      overlayImage = overlayImage.bandjoin(127);
    } else {
      // this is a pretty cool line, just saying
      overlayImage = overlayImage * vector<double>{1, 1, 1, 0.5};
    }

    vector<VImage> img;
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * page_height, width, page_height) : in;
      VImage composited =
          img_frame.composite2(overlayImage, VIPS_BLEND_MODE_OVER);
      img.push_back(composited);
    }

    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, page_height);
    if (delay) final.set("delay", delay);

    void *buf;
    size_t length;
    final.write_to_buffer(
        ("." + type).c_str(), &buf, &length,
        type == "gif" ? VImage::option()->set("dither", 0) : 0);

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