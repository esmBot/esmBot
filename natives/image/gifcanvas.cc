#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <memory>
#include <optional>
#include <stdexcept>
#include <vector>
#include <vips/vips8>

#include "gifcanvas.h"

static bool findFirstImage(const unsigned char *buf, size_t len, GIF::Block &image, size_t &gce) {
  gce = 0;
  for (size_t pos = GIF::firstBlock(buf, len); pos && GIF::readBlock(buf, len, pos, image); pos = image.end) {
    if (image.type == GIF::IMAGE_SEPARATOR) return true;
    if (GIF::isGce(buf, image)) gce = image.pos;
  }
  return false;
}

struct Frames {
  GIF::Block first;
  size_t firstGce;
  std::vector<size_t> later;
  size_t end;
};

static std::optional<Frames> findFrames(const unsigned char *buf, size_t len, int width, int height) {
  Frames frames{};
  bool haveFirst = false;
  size_t gce = 0;
  GIF::Block block;
  for (frames.end = GIF::firstBlock(buf, len); frames.end && GIF::readBlock(buf, len, frames.end, block);
       frames.end = block.end) {
    if (block.type == GIF::EXT_INTRODUCER && block.label == GIF::EXT_GRAPHIC_CONTROL) {
      if (!GIF::isGce(buf, block) || gce) return std::nullopt;
      gce = block.pos;
      continue;
    }
    if (block.type != GIF::IMAGE_SEPARATOR) continue;
    size_t frameGce = gce;
    gce = 0;

    // this frame would leave a hole in motivate's background
    int disposal = frameGce ? GIF::gceDisposal(buf + frameGce) : 0;
    if (disposal != 0 && disposal != GIF::DISPOSAL_NONE) return std::nullopt;

    if (!haveFirst) {
      if (!frameGce || frameGce + GIF::GCE_LEN != block.pos) return std::nullopt;
      frames.first = block;
      frames.firstGce = frameGce;
      haveFirst = true;
      continue;
    }
    // this frame would be drawn over the caption
    const unsigned char *d = buf + block.pos;
    if (readUint16LE(d + GIF::IMAGE_X_OFFSET) + readUint16LE(d + GIF::IMAGE_WIDTH_OFFSET) > width ||
        readUint16LE(d + GIF::IMAGE_Y_OFFSET) + readUint16LE(d + GIF::IMAGE_HEIGHT_OFFSET) > height)
      return std::nullopt;
    frames.later.push_back(block.pos);
  }
  if (frames.later.empty()) return std::nullopt;
  if (frames.end < len && (buf[frames.end] == GIF::IMAGE_SEPARATOR || buf[frames.end] == GIF::EXT_INTRODUCER))
    return std::nullopt;
  return frames;
}

struct EncodedFrame {
  std::unique_ptr<void, decltype(&g_free)> owner{nullptr, g_free};
  const unsigned char *descriptor, *palette, *data;
  size_t paletteLen, dataLen;
  unsigned char paletteSize;
  int transparent;
};

static EncodedFrame encodeFrame(vips::VImage frame, bool *shouldKill) {
  SetupTimeoutCallback(frame, shouldKill);
  void *buf;
  size_t len = 0;
  frame.write_to_buffer(".gif", &buf, &len, vips::VImage::option()->set("dither", 0));
  EncodedFrame out;
  out.owner.reset(buf);
  const unsigned char *enc = static_cast<const unsigned char *>(buf);

  GIF::Block image;
  size_t gce;
  // libvips puts a single frame's palette in the global table
  if (!findFirstImage(enc, len, image, gce) || !(enc[GIF::SCREEN_FLAGS_OFFSET] & GIF::COLOUR_TABLE_MASK) ||
      (enc[image.pos + GIF::IMAGE_FLAGS_OFFSET] & GIF::COLOUR_TABLE_MASK) ||
      readUint16LE(enc + image.pos + GIF::IMAGE_WIDTH_OFFSET) != frame.width() ||
      readUint16LE(enc + image.pos + GIF::IMAGE_HEIGHT_OFFSET) != frame.height())
    throw std::runtime_error("gif: unexpected GIF from libvips");

  out.descriptor = enc + image.pos;
  out.palette = enc + GIF::HEADER_LEN;
  out.paletteLen = GIF::colourTableSize(enc[GIF::SCREEN_FLAGS_OFFSET]);
  out.paletteSize = enc[GIF::SCREEN_FLAGS_OFFSET] & GIF::COLOUR_TABLE_SIZE_MASK;
  out.data = out.descriptor + GIF::IMAGE_DESCRIPTOR_LEN;
  out.dataLen = image.end - image.pos - GIF::IMAGE_DESCRIPTOR_LEN;
  out.transparent =
    gce && (enc[gce + GIF::GCE_FLAGS_OFFSET] & GIF::MASK_TRANSPARENCY) ? enc[gce + GIF::GCE_TRANSPARENT_OFFSET] : -1;
  return out;
}

std::optional<CmdOutput> GifExtendCanvas(const char *data, size_t len, vips::VImage in,
                                         const std::function<vips::VImage(vips::VImage)> &transform, int left, int top,
                                         bool *shouldKill) {
  const unsigned char *buf = reinterpret_cast<const unsigned char *>(data);

  int width = in.width(), height = vips_image_get_page_height(in.get_image());
  std::optional<Frames> frames = findFrames(buf, len, width, height);
  if (!frames) return std::nullopt;
  const GIF::Block &image = frames->first;

  vips::VImage first = transform(in.crop(0, 0, width, height)).copy();
  if (first.width() > UINT16_MAX || first.height() > UINT16_MAX || left < 0 || top < 0 ||
      left + width > first.width() || top + height > first.height())
    return std::nullopt;
  first.set(VIPS_META_PAGE_HEIGHT, first.height());
  EncodedFrame enc = encodeFrame(first, shouldKill);

  size_t gce = frames->firstGce;
  size_t tail = frames->end - image.end;
  size_t outLen = gce + GIF::GCE_LEN + GIF::IMAGE_DESCRIPTOR_LEN + enc.paletteLen + enc.dataLen + tail + 1;
  unsigned char *out = static_cast<unsigned char *>(malloc(outLen));
  unsigned char *p = out;
  auto put = [&](const void *src, size_t n) {
    memcpy(p, src, n);
    p += n;
  };

  put(buf, gce);
  writeUint16LE(out + GIF::SCREEN_WIDTH_OFFSET, first.width());
  writeUint16LE(out + GIF::SCREEN_HEIGHT_OFFSET, first.height());

  unsigned char *newGce = p;
  p += GIF::GCE_LEN;
  newGce[0] = GIF::EXT_INTRODUCER;
  newGce[1] = GIF::EXT_GRAPHIC_CONTROL;
  newGce[2] = 4;
  newGce[GIF::GCE_FLAGS_OFFSET] = (GIF::DISPOSAL_NONE << 2) | (enc.transparent >= 0 ? GIF::MASK_TRANSPARENCY : 0);
  writeUint16LE(newGce + GIF::GCE_DELAY_OFFSET, readUint16LE(buf + gce + GIF::GCE_DELAY_OFFSET));
  newGce[GIF::GCE_TRANSPARENT_OFFSET] = enc.transparent >= 0 ? enc.transparent : 0;
  newGce[GIF::GCE_LEN - 1] = GIF::BLOCK_TERMINATOR;

  // we use a local palette so we can keep the original gif's global palette
  unsigned char *descriptor = p;
  put(enc.descriptor, GIF::IMAGE_DESCRIPTOR_LEN);
  descriptor[GIF::IMAGE_FLAGS_OFFSET] = GIF::COLOUR_TABLE_MASK | enc.paletteSize;
  put(enc.palette, enc.paletteLen);
  put(enc.data, enc.dataLen);

  unsigned char *moved = p;
  put(buf + image.end, tail);
  for (size_t pos : frames->later) {
    unsigned char *d = moved + (pos - image.end);
    writeUint16LE(d + GIF::IMAGE_X_OFFSET, readUint16LE(d + GIF::IMAGE_X_OFFSET) + left);
    writeUint16LE(d + GIF::IMAGE_Y_OFFSET, readUint16LE(d + GIF::IMAGE_Y_OFFSET) + top);
  }
  *p++ = GIF::TRAILER;

  return CmdOutput{reinterpret_cast<char *>(out), outLen};
}
