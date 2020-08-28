#include <napi.h>
#include <list>
#include <ZXing/ReadBarcode.h>
#include <ZXing/TextUtfEncoding.h>

#define STB_IMAGE_IMPLEMENTATION
#include <stb/stb_image.h>

using namespace std;
using namespace ZXing;

class QrReadWorker : public Napi::AsyncWorker {
 public:
  QrReadWorker(Napi::Function& callback, string in_path)
      : Napi::AsyncWorker(callback), in_path(in_path) {}
  ~QrReadWorker() {}

  void Execute() {
    int width, height, channels;
    unique_ptr<stbi_uc, void(*)(void*)> buffer(stbi_load(in_path.c_str(), &width, &height, &channels, 4), stbi_image_free);
    auto result = ReadBarcode(width, height, buffer.get(), width * 4, 4, 0, 1, 2, { BarcodeFormat::QR_CODE });
    if (result.isValid()) {
      final = TextUtfEncoding::ToUtf8(result.text());
      missing = false;
    } else {
      final = "";
    }
  }

  void OnOK() {
    Napi::Object object = Napi::Object::New(Env());
    object.Set("qrText", final);
    object.Set("missing", missing);
    Callback().Call({Env().Undefined(), object});
  }

 private:
  string in_path, final;
  bool missing = true;
};

Napi::Value QrRead(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Function cb = info[1].As<Napi::Function>();
  string path = obj.Get("path").As<Napi::String>().Utf8Value();

  QrReadWorker* qrReadWorker = new QrReadWorker(cb, path);
  qrReadWorker->Queue();
  return env.Undefined();
}