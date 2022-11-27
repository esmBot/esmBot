#pragma once

#include <napi.h>

char* Watermark(string type, char* BufferData, size_t BufferLength, map<string, string> Arguments, size_t* DataSize);