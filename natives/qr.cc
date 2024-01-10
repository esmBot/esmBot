#ifdef ZXING_ENABLED
#include <ZXing/BitMatrix.h>
#include <ZXing/CharacterSet.h>
#include <ZXing/ImageView.h>
#include <ZXing/MultiFormatWriter.h>
#include <ZXing/ReadBarcode.h>
#include <vips/vips8>

#include "common.h"

ArgumentMap QrCreate([[maybe_unused]] const string& type, string& outType, ArgumentMap arguments, size_t& dataSize) {
  string text = GetArgument<string>(arguments, "text");

  auto writer = ZXing::MultiFormatWriter(ZXing::BarcodeFormat::QRCode).setMargin(1).setEncoding(ZXing::CharacterSet::UTF8);

  ZXing::BitMatrix matrix = writer.encode(text, 0, 0);
  ZXing::Matrix<unsigned char> bitmap = ZXing::ToMatrix<uint8_t>(matrix);

  vips::VImage img = vips::VImage::new_from_memory(const_cast<unsigned char*>(bitmap.data()), bitmap.size(), bitmap.width(), bitmap.height(), 1, VIPS_FORMAT_UCHAR)
                     .resize(4, vips::VImage::option()->set("kernel", VIPS_KERNEL_NEAREST));

  char *buf;
  img.write_to_buffer(("." + outType).c_str(), reinterpret_cast<void**>(&buf), &dataSize);

  ArgumentMap output;
  output["buf"] = buf;

  return output;
}

ArgumentMap QrRead([[maybe_unused]] const string& type, string& outType, const char* bufferdata, size_t bufferLength, [[maybe_unused]] ArgumentMap arguments, size_t& dataSize) {
  vips::VOption *options = vips::VImage::option()->set("access", "sequential");

  vips::VImage in =
      vips::VImage::new_from_buffer(bufferdata, bufferLength, "", options)
      .colourspace(VIPS_INTERPRETATION_B_W).extract_band(0, vips::VImage::option()->set("n", 1));

  vips_image_wio_input(in.get_image());

  ZXing::ReaderOptions opts;
  opts.setTryHarder(true);
  opts.setTryRotate(true);
  opts.setTryInvert(true);
  opts.setTryDownscale(true);
  opts.setFormats(ZXing::BarcodeFormat::QRCode);
  opts.setMaxNumberOfSymbols(0xff);

  ZXing::ImageView img(VIPS_IMAGE_ADDR(in.get_image(), 0, 0), in.width(), in.height(), ZXing::ImageFormat::Lum);
  auto results = ZXing::ReadBarcodes(img, opts);

  ArgumentMap output;

  if (results.empty()) {
    output["buf"] = "";
    outType = "empty";
    return output;
  }

  ZXing::Result result = results.front();
  string resultText = result.text();
  dataSize = resultText.length();

  char *data = reinterpret_cast<char*>(malloc(dataSize));
  memcpy(data, resultText.c_str(), dataSize);

  output["buf"] = data;
  outType = "text";
  return output;
}
#endif