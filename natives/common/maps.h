#include "../image/commands.h"
#include "argmap.h"

namespace esmb {
  namespace Image {
    const std::map<std::string, CmdOutput (*)(const std::string &type, std::string &outType, const char *bufferData,
                                              size_t bufferLength, esmb::ArgumentMap arguments, bool *shouldKill)>
      FunctionMap = {
        {"blur",       &Blur      },
        {"bounce",     &Bounce    },
        {"caption",    &Caption   },
        {"captionTwo", &CaptionTwo},
        {"circle",     &Circle    },
        {"colors",     &Colors    },
        {"crop",       &Crop      },
        {"deepfry",    &Deepfry   },
        {"distort",    &Distort   },
        {"fade",       &Fade      },
        {"flag",       &Flag      },
        {"flip",       &Flip      },
        {"freeze",     &Freeze    },
        {"gamexplain", &Gamexplain},
        {"globe",      &Globe     },
        {"invert",     &Invert    },
        {"jpeg",       &Jpeg      },
#ifdef MAGICK_ENABLED
        {"magik",      &Magik     },
#endif
        {"meme",       &Meme      },
        {"mirror",     &Mirror    },
        {"motivate",   &Motivate  },
        {"petpet",     &Petpet    },
#ifdef ZXING_ENABLED
        {"qrread",     &QrRead    },
#endif
        {"reddit",     &Reddit    },
        {"resize",     &Resize    },
        {"reverse",    &Reverse   },
        {"scott",      &Scott     },
        {"slide",      &Slide     },
        {"snapchat",   &Snapchat  },
        {"speed",      &Speed     },
        {"spin",       &Spin      },
        {"spotify",    &Spotify   },
        {"squish",     &Squish    },
        {"swirl",      &Swirl     },
        {"tile",       &Tile      },
        {"togif",      &ToGif     },
        {"uncanny",    &Uncanny   },
        {"uncaption",  &Uncaption },
        {"wall",       &Wall      },
        {"watermark",  &Watermark },
        {"whisper",    &Whisper   }
    };

    const std::map<std::string, CmdOutput (*)(const std::string &type, std::string &outType,
                                              esmb::ArgumentMap arguments, bool *shouldKill)>
      NoInputFunctionMap = {
        {"homebrew", &Homebrew},
#if ZXING_ENABLED
        {"qrcreate", &QrCreate},
#endif
        {"sonic",    &Sonic   }
    };

    const std::map<std::string, FunctionArgs *> FunctionArgsMap = {
      {"blur",       &BlurArgs      },
      {"caption",    &CaptionArgs   },
      {"captionTwo", &CaptionTwoArgs},
      {"colors",     &ColorsArgs    },
      {"distort",    &DistortArgs   },
      {"fade",       &FadeArgs      },
      {"flag",       &FlagArgs      },
      {"flip",       &FlipArgs      },
      {"freeze",     &FreezeArgs    },
      {"gamexplain", &GamexplainArgs},
      {"globe",      &GlobeArgs     },
      {"homebrew",   &HomebrewArgs  },
      {"jpeg",       &JpegArgs      },
      {"meme",       &MemeArgs      },
      {"mirror",     &MirrorArgs    },
      {"motivate",   &MotivateArgs  },
      {"petpet",     &PetpetArgs    },
#if ZXING_ENABLED
      {"qrcreate",   &QrCreateArgs  },
#endif
      {"reddit",     &RedditArgs    },
      {"resize",     &ResizeArgs    },
      {"reverse",    &ReverseArgs   },
      {"scott",      &ScottArgs     },
      {"slide",      &SlideArgs     },
      {"snapchat",   &SnapchatArgs  },
      {"sonic",      &SonicArgs     },
      {"speed",      &SpeedArgs     },
      {"spotify",    &SpotifyArgs   },
      {"uncanny",    &UncannyArgs   },
      {"uncaption",  &UncaptionArgs },
      {"watermark",  &WatermarkArgs },
      {"whisper",    &WhisperArgs   }
    };
  } // namespace Image
} // namespace esmb
