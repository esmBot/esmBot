#include "common.h"

void LoadFonts(string basePath)
{
  // manually loading fonts to workaround some font issues with libvips
  if (!FcConfigAppFontAddDir(
          NULL, (const FcChar8*)(basePath + "assets/fonts/").c_str())) {
    std::cerr
        << "Unable to load local font files from directory, falling back to "
           "global fonts (which may be inaccurate!)"
        << std::endl;
  }
  if (!FcConfigParseAndLoad(
          FcConfigGetCurrent(),
          (const FcChar8*)(basePath + "assets/fonts/fontconfig.xml").c_str(),
          true)) {
    std::cerr
        << "Unable to load local fontconfig, some fonts may be inaccurate!"
        << std::endl;
  }
}

bool MapContainsKey(const ArgumentMap& map, const string& key)
{
  ArgumentMap::const_iterator it = map.find(key);
  return it != map.end();
}
