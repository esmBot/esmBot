#ifdef ZXING_ENABLED
#include <ZXing/BitMatrix.h>
#include <ZXing/MultiFormatWriter.h>
#include <ZXing/ReadBarcode.h>
#include <ZXing/ZXVersion.h>
#if ZXING_VERSION_MAJOR < 2
#include <ZXing/TextUtfEncoding.h>
#endif
#include <vips/vips8>

#include "common.h"

ArgumentMap QrCreate([[maybe_unused]] const string &type, string &outType, ArgumentMap arguments,
                     [[maybe_unused]] bool *shouldKill) {
  string text = GetArgument<string>(arguments, "text");

  auto writer =
    ZXing::MultiFormatWriter(ZXing::BarcodeFormat::QRCode).setMargin(1).setEncoding(ZXing::CharacterSet::UTF8);

#if ZXING_VERSION_MAJOR >= 2
  ZXing::BitMatrix matrix = writer.encode(text, 0, 0);
#else
  ZXing::BitMatrix matrix = writer.encode(ZXing::TextUtfEncoding::FromUtf8(text), 0, 0);
#endif
  ZXing::Matrix<unsigned char> bitmap = ZXing::ToMatrix<uint8_t>(matrix);

  vips::VImage img = vips::VImage::new_from_memory(const_cast<unsigned char *>(bitmap.data()), bitmap.size(),
                                                   bitmap.width(), bitmap.height(), 1, VIPS_FORMAT_UCHAR)
                       .resize(4, vips::VImage::option()->set("kernel", VIPS_KERNEL_NEAREST));

  char *buf;
  size_t dataSize = 0;
  img.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void **>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;
  output["size"] = dataSize;

  return output;
}

ArgumentMap QrRead([[maybe_unused]] const string &type, string &outType, const char *bufferdata, size_t bufferLength,
                   [[maybe_unused]] ArgumentMap arguments, [[maybe_unused]] bool *shouldKill) {
  vips::VOption *options = vips::VImage::option()->set("access", "sequential");

  vips::VImage in = vips::VImage::new_from_buffer(bufferdata, bufferLength, "", options)
                      .colourspace(VIPS_INTERPRETATION_B_W)
                      .extract_band(0, vips::VImage::option()->set("n", 1));

  vips_image_wio_input(in.get_image());

#if ZXING_VERSION_MAJOR >= 2
#if ZXING_VERSION_MINOR >= 2
  ZXing::ReaderOptions opts;
#else
  ZXing::DecodeHints opts;
#endif
#else
  ZXing::DecodeHints opts;
#endif

  opts.setFormats(ZXing::BarcodeFormat::QRCode);

  ZXing::ImageView img(VIPS_IMAGE_ADDR(in.get_image(), 0, 0), in.width(), in.height(), ZXing::ImageFormat::Lum);
  ZXing::Result result = ZXing::ReadBarcode(img, opts);

  ArgumentMap output;

  if (!result.isValid()) {
    output["buf"] = "";
    outType = "empty";
    return output;
  }

#if ZXING_VERSION_MAJOR >= 2
  string resultText = result.text();
#else
  string resultText = ZXing::TextUtfEncoding::ToUtf8(result.text());
#endif
  size_t dataSize = resultText.length();

  char *data = reinterpret_cast<char *>(malloc(dataSize));
  memcpy(data, resultText.c_str(), dataSize);

  output["buf"] = data;
  output["size"] = dataSize;
  outType = "text";
  return output;
}
#endif