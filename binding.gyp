{
  "targets": [
    {
      "target_name": "image",
      "sources": [ "<!@(node -p \"require('fs').readdirSync('./natives').map(f=>'natives/'+f).join(' ')\")" ],
      "cflags!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++)" ],
      "cflags_cc!": [ "-fno-exceptions", "<!(pkg-config --cflags Magick++)" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!@(pkg-config --cflags-only-I Magick++ | sed 's/^.\{2\}//')"
      ],
      "libraries": [
        "<!(pkg-config --libs Magick++)",
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}