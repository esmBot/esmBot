#include <napi.h>

#include <vips/vips8>

using namespace std;
using namespace vips;

Napi::Value Globe(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  try {
    Napi::Object obj = info[0].As<Napi::Object>();
    Napi::Buffer<char> data = obj.Get("data").As<Napi::Buffer<char>>();
    string type = obj.Get("type").As<Napi::String>().Utf8Value();
    string basePath = obj.Get("basePath").As<Napi::String>().Utf8Value();

    VOption *options = VImage::option();

    VImage in =
        VImage::new_from_buffer(
            data.Data(), data.Length(), "",
            type == "gif" ? options->set("n", -1)->set("access", "sequential")
                          : options)
            .colourspace(VIPS_INTERPRETATION_sRGB);
    if (!in.has_alpha()) in = in.bandjoin(255);

    int width = in.width();
    int page_height = vips_image_get_page_height(in.get_image());
    int n_pages = type == "gif" ? vips_image_get_n_pages(in.get_image()) : 30;

    double size = min(width, page_height);

    string diffPath = basePath + "assets/images/globediffuse.png";
    VImage diffuse =
        VImage::new_from_file(diffPath.c_str())
            .resize(size / 500.0,
                    VImage::option()->set("kernel", VIPS_KERNEL_CUBIC)) /
        255;

    string specPath = basePath + "assets/images/globespec.png";
    VImage specular =
        VImage::new_from_file(specPath.c_str())
            .resize(size / 500.0,
                    VImage::option()->set("kernel", VIPS_KERNEL_CUBIC));

    string distortPath = basePath + "assets/images/spheremap.png";
    VImage distort =
        (VImage::new_from_file(distortPath.c_str())
             .resize(size / 500.0,
                     VImage::option()->set("kernel", VIPS_KERNEL_CUBIC)) /
         65535) *
        size;

    vector<VImage> img;
    for (int i = 0; i < n_pages; i++) {
      VImage img_frame =
          type == "gif" ? in.crop(0, i * page_height, width, page_height) : in;
      VImage resized = img_frame.resize(
          size / (double)width,
          VImage::option()->set("vscale", size / (double)page_height));
      VImage rolled = img_frame.wrap(
          VImage::option()->set("x", width * i / n_pages)->set("y", 0));
      VImage extracted = rolled.extract_band(0, VImage::option()->set("n", 3));
      VImage mapped = extracted.mapim(distort);
      VImage composited = mapped * diffuse + specular;
      VImage frame = composited.bandjoin(diffuse > 0.0);
      img.push_back(frame);
    }
    VImage final = VImage::arrayjoin(img, VImage::option()->set("across", 1));
    final.set(VIPS_META_PAGE_HEIGHT, size);
    if (type != "gif") {
      vector<int> delay(30, 50);
      final.set("delay", delay);
    }

    void *buf;
    size_t length;
    final.write_to_buffer(".gif", &buf, &length);

    Napi::Object result = Napi::Object::New(env);
    result.Set("data", Napi::Buffer<char>::Copy(env, (char *)buf, length));
    result.Set("type", "gif");
    return result;
  } catch (std::exception const &err) {
    throw Napi::Error::New(env, err.what());
  } catch (...) {
    throw Napi::Error::New(env, "Unknown error");
  }
}