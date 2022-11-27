#include "common.h"

#include <vips/vips8>
#include <string>
#include <map>

using namespace std;
using namespace vips;

char* Blur(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize) {
  	string caption = Arguments["caption"];
    string font = MAP_GET(Arguments, "font");
	  bool sharp = MAP_GET(Arguments, "sharp") == "true";
    VOption *options = VImage::option()->set("access", "sequential");

    VImage in =
      VImage::new_from_buffer(BufferData, BufferLength, "",
            type == "gif" ? options->set("n", -1) : options)
              .colourspace(VIPS_INTERPRETATION_sRGB);

    if (!in.has_alpha()) in = in.bandjoin(255);

    // TODO: find a better way to calculate the intensity for GIFs without
    // splitting frames
    VImage out = sharp ? in.sharpen(VImage::option()->set("sigma", 3))
                       : in.gaussblur(15);

    void *buf;
    out.write_to_buffer(("." + type).c_str(), &buf, DataSize);

	vips_error_clear();
  	vips_thread_shutdown();

 	return (char*) buf;
}
