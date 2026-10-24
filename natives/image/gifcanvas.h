#pragma once

#include <functional>
#include <optional>
#include <vips/vips8>

#include "../common/gif.h"
#include "common.h"

// Transforms the first frame and creates a new GIF that consists of the
// transformed first frame, and every other frame shifted down and to the right.
// Returns nothing if we can't fast path it.
std::optional<CmdOutput> GifExtendCanvas(const char *buf, size_t len, vips::VImage in,
                                         const std::function<vips::VImage(vips::VImage)> &transform, int left, int top,
                                         bool *shouldKill);
