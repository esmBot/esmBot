#pragma once

#include <fontconfig/fontconfig.h>
#include <vips/vips8>

#include <map>
#include <string>
#include <unordered_map>
#include <variant>

using std::map;
using std::string;
using std::variant;

void SetupTimeoutCallback(vips::VImage image, bool *shouldKill);
typedef struct {
  time_t expiration;
  bool *shouldKill;
} CallbackData;
#define IMG_TIMEOUT 600

#include "commands.h"

void LoadFonts(string basePath);
vips::VImage NormalizeVips(vips::VImage in, int *width, int *pageHeight, int nPages);
vips::VOption *GetInputOptions(string type, bool sequential, bool sequentialIfAnim);

const std::vector<double> zeroVec = {0, 0, 0, 0};
const std::vector<double> zeroVecOneAlpha = {0, 0, 0, 1};

const std::unordered_map<std::string, std::string> fontPaths{
  {"futura",    "assets/fonts/caption.otf" },
  {"helvetica", "assets/fonts/caption2.ttf"},
  {"roboto",    "assets/fonts/reddit.ttf"  },
  {"ubuntu",    "assets/fonts/Ubuntu.ttf"  }
};
