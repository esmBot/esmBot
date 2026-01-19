#pragma once

#include "../shared.h"

namespace esmb::Image {
  // Declare our Input Functions
  declare_input_func(Blur);
  declare_input_func(Bounce);
  declare_input_func(Caption);
  declare_input_func(CaptionTwo);
  declare_input_func(Circle);
  declare_input_func(Colors);
  declare_input_func(Crop);
  declare_input_func(Deepfry);
  declare_input_func(Distort);
  declare_input_func(Fade);
  declare_input_func(Flag);
  declare_input_func(Flip);
  declare_input_func(Freeze);
  declare_input_func(Gamexplain);
  declare_input_func(Globe);
  declare_input_func(Invert);
  declare_input_func(Jpeg);
#if MAGICK_ENABLED
  declare_input_func(Magik);
#endif
  declare_input_func(Meme);
  declare_input_func(Mirror);
  declare_input_func(Motivate);
  declare_input_func(Petpet);
#if ZXING_ENABLED
  declare_input_func(QrRead);
#endif
  declare_input_func(Reddit);
  declare_input_func(Resize);
  declare_input_func(Reverse);
  declare_input_func(Scott);
  declare_input_func(Slide);
  declare_input_func(Snapchat);
  declare_input_func(Speed);
  declare_input_func(Spin);
  declare_input_func(Spotify);
  declare_input_func(Squish);
  declare_input_func(Swirl);
  declare_input_func(Tile);
  declare_input_func(ToGif);
  declare_input_func(Uncanny);
  declare_input_func(Uncaption);
  declare_input_func(Wall);
  declare_input_func(Watermark);
  declare_input_func(Whisper);

  // Declare our No-Input Functions

  declare_noinput_func(Homebrew);
#if ZXING_ENABLED
  declare_noinput_func(QrCreate);
#endif
  declare_noinput_func(Sonic);

  // Declare our Input Args
  declare_input_args(BlurArgs);
  declare_input_args(CaptionArgs);
  declare_input_args(CaptionTwoArgs);
  declare_input_args(ColorsArgs);
  declare_input_args(DistortArgs);
  declare_input_args(FadeArgs);
  declare_input_args(FlagArgs);
  declare_input_args(FlipArgs);
  declare_input_args(FreezeArgs);
  declare_input_args(GamexplainArgs);
  declare_input_args(GlobeArgs);
  declare_input_args(HomebrewArgs);
  declare_input_args(JpegArgs);
  declare_input_args(MemeArgs);
  declare_input_args(MirrorArgs);
  declare_input_args(MotivateArgs);
  declare_input_args(PetpetArgs);
#if ZXING_ENABLED
  declare_input_args(QrCreateArgs);
#endif
  declare_input_args(RedditArgs);
  declare_input_args(ResizeArgs);
  declare_input_args(ReverseArgs);
  declare_input_args(ScottArgs);
  declare_input_args(SlideArgs);
  declare_input_args(SnapchatArgs);
  declare_input_args(SonicArgs);
  declare_input_args(SpeedArgs);
  declare_input_args(SpotifyArgs);
  declare_input_args(UncannyArgs);
  declare_input_args(UncaptionArgs);
  declare_input_args(WatermarkArgs);
  declare_input_args(WhisperArgs);
} // namespace esmb::Image
