{
  "targets": [
    {
      "target_name": "image",
      "sources": [
        "./natives/9gag.cc",
        "./natives/bandicam.cc",
        "./natives/blur.cc",
        "./natives/blurple.cc",
        "./natives/circle.cc",
        "./natives/deviantart.cc",
        "./natives/explode.cc",
        "./natives/image.cc",
        "./natives/invert.cc"
      ],
      "cflags!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++)" ],
      "cflags_cc!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++)" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "/usr/include/ImageMagick-7",
        "/usr/include/vips",
        "/usr/include/glib-2.0",
        "/usr/lib/glib-2.0/include"
      ],
      "libraries": [
        "<!(pkg-config --libs Magick++)",
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}