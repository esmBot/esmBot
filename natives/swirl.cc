#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Swirl(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);

  try {
    Napi::Object obj = info[1].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
        VImage::new_from_buffer(data.Data(), data.Length(), "",
                                type == "gif" ? options->set("n", -1) : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha())
      in = in.bandjoin(255);

    int pageHeight = vips_image_get_page_height(in.get_image());
    int nPages = vips_image_get_n_pages(in.get_image());
    int width = in.width();
    double newWidth = width * 3;
    double newHeight = pageHeight * 3;
    vector<double> divSize = {newWidth / 2, newHeight / 2};

    VImage index = VImage::xyz(newWidth, newHeight);
    VImage center = index - divSize;
    VImage polar = center
                       .copy(VImage::option()
                                 ->set("format", VIPS_FORMAT_COMPLEX)
                                 ->set("bands", 1))
                       .polar()
                       .copy(VImage::option()
                                 ->set("format", VIPS_FORMAT_FLOAT)
                                 ->set("bands", 2));

    int size = min(width, pageHeight) / 2;

    VImage test = (1 - polar.extract_band(0) / size);
    VImage degrees = test.cast(VIPS_FORMAT_FLOAT).pow(2);

    VImage angle = polar.extract_band(1) + degrees * 180;

    VImage distortion = polar.extract_band(0)
                            .bandjoin(angle)
                            .copy(VImage::option()
                                      ->set("format", VIPS_FORMAT_COMPLEX)
                                      ->set("bands", 1))
                            .rect()
                            .copy(VImage::option()
                                      ->set("format", VIPS_FORMAT_FLOAT)
                                      ->set("bands", 2)) +
                        divSize;

    vector<VImage> img;
    for (int i = 0; i < nPages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * pageHeight, width, pageHeight) : in;

      VImage distort =
          img_frame
              .gravity(VIPS_COMPASS_DIRECTION_CENTRE, newWidth, newHeight,
                       VImage::option()->set("extend", VIPS_EXTEND_COPY))
              .mapim(distortion, VImage::option()->set(
                                     "interpolate",
                                     VInterpolate::new_from_name("bicubic")));
      VImage frame = distort.crop(width, pageHeight, width, pageHeight);
      img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, pageHeight);

    void *buf;
    size_t length;
    final.write_to_buffer(".gif", &buf, &length);

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