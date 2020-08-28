{
  "targets": [
    {
      "target_name": "image",
      "sources": [ "<!@(node -p \"require('fs').readdirSync('./natives').map(f=>'natives/'+f).join(' ')\")" ],
      "cflags!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++ zxing)" ],
      "cflags_cc!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++ zxing)" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "/usr/include/ImageMagick-7",
        "/usr/include/glib-2.0",
        "/usr/lib/glib-2.0/include"
      ],
      "libraries": [
        "<!(pkg-config --libs Magick++ zxing)ZXing",
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}