#pragma once

#include "common.h"
#include <map>

using std::map;
using std::string;

char* Deepfry(string* type, char* BufferData, size_t BufferLength, ArgumentMap Arguments, size_t* DataSize);